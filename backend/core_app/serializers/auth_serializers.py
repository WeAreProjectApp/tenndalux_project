"""
Serializers for user authentication and profile management.

Provides serializers for registration, login, and profile operations
following the architecture standards.
"""
from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from ..models import User


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    
    Handles new user creation with email/password validation
    and password confirmation.
    """
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'first_name', 'last_name', 'phone']
    
    def validate(self, attrs):
        """
        Validate that passwords match.
        
        Args:
            attrs: Dictionary of field values.
        
        Returns:
            dict: Validated attributes.
        
        Raises:
            ValidationError: If passwords don't match.
        """
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match'})
        user = User(
            email=attrs['email'],
            first_name=attrs.get('first_name', ''),
            last_name=attrs.get('last_name', ''),
        )
        try:
            validate_password(attrs['password'], user=user)
        except DjangoValidationError as error:
            raise serializers.ValidationError({'password': error.messages}) from error
        return attrs
    
    def create(self, validated_data):
        """
        Create a new user with hashed password.
        
        Args:
            validated_data: Validated data from serializer.
        
        Returns:
            User: The created user instance.
        """
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            phone=validated_data.get('phone', ''),
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer for user login.
    
    Validates email and password credentials.
    """
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={'input_type': 'password'})
    
    def validate(self, attrs):
        """
        Validate user credentials.
        
        Args:
            attrs: Dictionary with email and password.
        
        Returns:
            dict: Validated attributes with user instance.
        
        Raises:
            ValidationError: If credentials are invalid.
        """
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            user = authenticate(request=self.context.get('request'), username=email, password=password)
            
            if not user:
                raise serializers.ValidationError('Invalid email or password')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include "email" and "password"')


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile view and updates.
    
    Provides read-only fields for sensitive data and allows
    updating profile information.
    """
    full_name = serializers.ReadOnlyField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 'full_name',
            'role', 'phone', 'avatar', 'is_active', 'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'email', 'role', 'is_active', 'date_joined', 'last_login']
    
    def update(self, instance, validated_data):
        """
        Update user profile fields.
        
        Args:
            instance: Existing user instance.
            validated_data: New data from request.
        
        Returns:
            User: Updated user instance.
        """
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.phone = validated_data.get('phone', instance.phone)
        
        if 'avatar' in validated_data:
            instance.avatar = validated_data['avatar']
        
        instance.save()
        return instance
