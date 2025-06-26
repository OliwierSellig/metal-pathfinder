import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";

interface UpdatePasswordFormProps {
  token?: string;
}

const UpdatePasswordForm: React.FC<UpdatePasswordFormProps> = ({ token }) => {
  const [formData, setFormData] = React.useState({
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  // Validate form data
  const validateForm = React.useCallback(() => {
    const errors: typeof validationErrors = {};

    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 8) {
      errors.password = "Password must be at least 8 characters long";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Validate on form data change
  React.useEffect(() => {
    if (formData.password || formData.confirmPassword) {
      validateForm();
    }
  }, [formData, validateForm]);

  const isFormValid = React.useMemo(() => {
    return formData.password && formData.confirmPassword && Object.keys(validationErrors).length === 0;
  }, [formData, validationErrors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isLoading) {
      return;
    }

    if (!token) {
      toast.error("Invalid or missing reset token");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: formData.password,
          token,
        }),
      });

      if (response.ok) {
        toast.success("Password updated successfully! Please log in with your new password.");
        window.location.href = "/login";
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to update password");
      }
    } catch (error) {
      console.error("Update password error:", error);
      toast.error("Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">Invalid Reset Link</h3>
        <p className="text-gray-600">This password reset link is invalid or has expired. Please request a new one.</p>
        <div className="space-y-2">
          <a
            href="/forgot-password"
            className="inline-block w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Request New Reset Link
          </a>
          <a href="/login" className="block text-blue-600 hover:text-blue-500">
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          New password
        </label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange("password")}
          placeholder="Enter your new password (min. 8 characters)"
          disabled={isLoading}
          className={validationErrors.password ? "border-red-500" : ""}
        />
        {validationErrors.password && <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Confirm new password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleInputChange("confirmPassword")}
          placeholder="Confirm your new password"
          disabled={isLoading}
          className={validationErrors.confirmPassword ? "border-red-500" : ""}
        />
        {validationErrors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.confirmPassword}</p>
        )}
      </div>

      <Button type="submit" disabled={!isFormValid || isLoading} className="w-full">
        {isLoading ? "Updating password..." : "Update password"}
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Remember your password?{" "}
          <a href="/login" className="text-blue-600 hover:text-blue-500">
            Sign in
          </a>
        </p>
      </div>
    </form>
  );
};

export default UpdatePasswordForm;
