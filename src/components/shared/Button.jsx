import React from 'react';
import { Button as MuiButton, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledButton = styled(MuiButton)(({ theme, size = 'medium', variant = 'contained' }) => ({
  borderRadius: theme.shape.borderRadius,
  textTransform: 'none',
  fontWeight: 500,
  boxShadow: variant === 'contained' ? 'none' : undefined,
  '&:hover': {
    boxShadow: variant === 'contained' ? '0px 2px 4px rgba(0, 0, 0, 0.1)' : undefined,
  },
  ...(size === 'small' && {
    padding: '6px 16px',
    fontSize: '0.875rem',
  }),
  ...(size === 'medium' && {
    padding: '8px 20px',
    fontSize: '0.9375rem',
  }),
  ...(size === 'large' && {
    padding: '10px 24px',
    fontSize: '1rem',
  }),
}));

const Button = ({
  children,
  loading = false,
  disabled = false,
  startIcon,
  endIcon,
  loadingPosition = 'center',
  ...props
}) => {
  const buttonContent = loading ? (
    <>
      {loadingPosition === 'start' && <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />}
      {loadingPosition === 'center' ? <CircularProgress size={20} color="inherit" /> : children}
      {loadingPosition === 'end' && <CircularProgress size={20} color="inherit" sx={{ ml: 1 }} />}
    </>
  ) : (
    children
  );

  return (
    <StyledButton
      disabled={disabled || loading}
      startIcon={!loading && loadingPosition !== 'start' ? startIcon : null}
      endIcon={!loading && loadingPosition !== 'end' ? endIcon : null}
      {...props}
    >
      {buttonContent}
    </StyledButton>
  );
};

export default Button;
