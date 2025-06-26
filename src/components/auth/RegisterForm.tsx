import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";

const RegisterForm: React.FC = () => {
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  // Validate form data
  const validateForm = React.useCallback(() => {
    const errors: typeof validationErrors = {};

    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

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
    if (formData.email || formData.password || formData.confirmPassword) {
      validateForm();
    }
  }, [formData, validateForm]);

  const isFormValid = React.useMemo(() => {
    return (
      formData.email && formData.password && formData.confirmPassword && Object.keys(validationErrors).length === 0
    );
  }, [formData, validationErrors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (response.ok) {
        toast.success("Account created successfully! Please log in.");
        window.location.href = "/login";
      } else {
        const error = await response.json();
        if (response.status === 409) {
          toast.error("An account with this email already exists");
        } else {
          toast.error(error.message || "Failed to create account");
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email address
        </label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={handleInputChange("email")}
          placeholder="Enter your email"
          disabled={isLoading}
          className={validationErrors.email ? "border-red-500" : ""}
        />
        {validationErrors.email && <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange("password")}
          placeholder="Enter your password (min. 8 characters)"
          disabled={isLoading}
          className={validationErrors.password ? "border-red-500" : ""}
        />
        {validationErrors.password && <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
          Confirm password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleInputChange("confirmPassword")}
          placeholder="Confirm your password"
          disabled={isLoading}
          className={validationErrors.confirmPassword ? "border-red-500" : ""}
        />
        {validationErrors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">{validationErrors.confirmPassword}</p>
        )}
      </div>

      <Button type="submit" disabled={!isFormValid || isLoading} className="w-full">
        {isLoading ? "Creating account..." : "Create account"}
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:text-blue-500">
            Sign in
          </a>
        </p>
      </div>
    </form>
  );
};

export default RegisterForm;
