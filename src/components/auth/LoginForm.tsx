import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";

const LoginForm: React.FC = () => {
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = React.useState(false);
  const [validationErrors, setValidationErrors] = React.useState<{
    email?: string;
    password?: string;
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
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Validate on form data change
  React.useEffect(() => {
    if (formData.email || formData.password) {
      validateForm();
    }
  }, [formData, validateForm]);

  const isFormValid = React.useMemo(() => {
    return formData.email && formData.password && Object.keys(validationErrors).length === 0;
  }, [formData, validationErrors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Successfully logged in!");
        window.location.href = "/discover";
      } else {
        const error = await response.json();
        toast.error(error.message || "Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Failed to log in. Please try again.");
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
          placeholder="Enter your password"
          disabled={isLoading}
          className={validationErrors.password ? "border-red-500" : ""}
        />
        {validationErrors.password && <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>}
      </div>

      <Button type="submit" disabled={!isFormValid || isLoading} className="w-full">
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          <a href="/forgot-password" className="text-blue-600 hover:text-blue-500">
            Forgot your password?
          </a>
        </p>
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <a href="/register" className="text-blue-600 hover:text-blue-500">
            Sign up
          </a>
        </p>
      </div>
    </form>
  );
};

export default LoginForm;
