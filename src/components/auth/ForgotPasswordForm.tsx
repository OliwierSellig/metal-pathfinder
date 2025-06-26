import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { toast } from "sonner";

const ForgotPasswordForm: React.FC = () => {
  const [email, setEmail] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isEmailSent, setIsEmailSent] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string>("");

  // Validate email
  const validateEmail = React.useCallback(() => {
    if (!email) {
      setValidationError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationError("Please enter a valid email address");
      return false;
    }
    setValidationError("");
    return true;
  }, [email]);

  // Validate on email change
  React.useEffect(() => {
    if (email) {
      validateEmail();
    }
  }, [email, validateEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateEmail() || isLoading) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setIsEmailSent(true);
        toast.success("Password reset instructions sent to your email");
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to send reset email");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900">Check your email</h3>
        <p className="text-gray-600">
          We&apos;ve sent password reset instructions to <span className="font-medium">{email}</span>
        </p>
        <p className="text-sm text-gray-500">
          Didn&apos;t receive the email? Check your spam folder or{" "}
          <button
            type="button"
            onClick={() => {
              setIsEmailSent(false);
              setEmail("");
            }}
            className="text-blue-600 hover:text-blue-500"
          >
            try again
          </button>
        </p>
        <div className="pt-4">
          <a href="/login" className="text-blue-600 hover:text-blue-500">
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email address
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email address"
          disabled={isLoading}
          className={validationError ? "border-red-500" : ""}
        />
        {validationError && <p className="text-red-500 text-sm mt-1">{validationError}</p>}
      </div>

      <Button type="submit" disabled={!email || !!validationError || isLoading} className="w-full">
        {isLoading ? "Sending..." : "Send reset instructions"}
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

export default ForgotPasswordForm;
