from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.auth import hash_password, verify_password, create_access_token, get_current_user
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse, ForgotPasswordRequest, ResetPasswordRequest

router = APIRouter()

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    email_lower = user_in.email.lower()
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == email_lower).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists."
        )
    
    # Auto-set admin role for this specific email
    is_admin = 1 if email_lower == "admin@jobanalyser.com" else 0
    
    # Create user
    db_user = User(
        name=user_in.name,
        email=email_lower,
        password_hash=hash_password(user_in.password),
        is_admin=is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Create token
    access_token = create_access_token(data={"sub": db_user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": db_user
    }

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    email_lower = credentials.email.lower()
    
    # Auto-seed default admin if database is empty or if this user doesn't exist
    if email_lower == "admin@jobanalyser.com":
        admin_user = db.query(User).filter(User.email == "admin@jobanalyser.com").first()
        if not admin_user and credentials.password == "admin12345":
            admin_user = User(
                name="System Admin",
                email="admin@jobanalyser.com",
                password_hash=hash_password("admin12345"),
                is_admin=1
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)

    user = db.query(User).filter(User.email == email_lower).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create token
    access_token = create_access_token(data={"sub": user.id})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

import random
MOCK_RESET_CODES: dict[str, str] = {}

@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email_lower = req.email.lower().strip()
    user = db.query(User).filter(User.email == email_lower).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account associated with this email address."
        )
    # Generate 6-digit reset code
    code = f"{random.randint(100000, 999999)}"
    MOCK_RESET_CODES[email_lower] = code
    print(f"\n[DEV MODE] Forgot password reset code for {email_lower}: {code}\n")
    return {
        "status": "success",
        "message": f"A password reset code has been sent (Simulated Code: {code})",
        # We return it in response for easy frontend local testing since we don't have SMTP server
        "code": code
    }

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    email_lower = req.email.lower().strip()
    user = db.query(User).filter(User.email == email_lower).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account associated with this email address."
        )
        
    expected_code = MOCK_RESET_CODES.get(email_lower)
    if not expected_code or req.code.strip() != expected_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code."
        )
        
    # Update password
    user.password_hash = hash_password(req.new_password)
    db.commit()
    
    # Remove code from memory
    MOCK_RESET_CODES.pop(email_lower, None)
    
    return {
        "status": "success",
        "message": "Password successfully reset! Please login with your new password."
    }
