import React, { forwardRef } from 'react';
import {
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  FormHelperText,
  InputLabel,
  OutlinedInput,
  styled
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius,
    transition: theme.transitions.create(['border-color', 'box-shadow']),
    '&:hover': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
    },
  },
  '& .MuiInputLabel-root': {
    '&.Mui-focused': {
      color: theme.palette.primary.main,
    },
  },
}));

const Input = forwardRef(({
  id,
  label,
  error,
  helperText,
  type = 'text',
  startAdornment,
  endAdornment,
  fullWidth = true,
  required = false,
  disabled = false,
  multiline = false,
  rows,
  value,
  onChange,
  onBlur,
  placeholder,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  if (type === 'password') {
    return (
      <StyledFormControl
        fullWidth={fullWidth}
        error={error}
        required={required}
        disabled={disabled}
        variant="outlined"
      >
        {label && <InputLabel htmlFor={id}>{label}</InputLabel>}
        <OutlinedInput
          id={id}
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          startAdornment={startAdornment && (
            <InputAdornment position="start">
              {startAdornment}
            </InputAdornment>
          )}
          endAdornment={
            <InputAdornment position="end">
              <IconButton
                aria-label="toggle password visibility"
                onClick={handleClickShowPassword}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          }
          label={label}
          {...props}
        />
        {helperText && (
          <FormHelperText error={error}>
            {helperText}
          </FormHelperText>
        )}
      </StyledFormControl>
    );
  }

  return (
    <TextField
      id={id}
      ref={ref}
      label={label}
      type={type}
      error={error}
      helperText={helperText}
      fullWidth={fullWidth}
      required={required}
      disabled={disabled}
      multiline={multiline}
      rows={rows}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      InputProps={{
        startAdornment: startAdornment && (
          <InputAdornment position="start">
            {startAdornment}
          </InputAdornment>
        ),
        endAdornment: endAdornment && (
          <InputAdornment position="end">
            {endAdornment}
          </InputAdornment>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: (theme) => theme.shape.borderRadius,
          transition: (theme) =>
            theme.transitions.create(['border-color', 'box-shadow']),
          '&:hover': {
            borderColor: 'primary.main',
          },
          '&.Mui-focused': {
            borderColor: 'primary.main',
            boxShadow: (theme) =>
              `0 0 0 2px ${theme.palette.primary.light}`,
          },
        },
        '& .MuiInputLabel-root': {
          '&.Mui-focused': {
            color: 'primary.main',
          },
        },
      }}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export default Input;
