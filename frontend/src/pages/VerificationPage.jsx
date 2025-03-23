import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Mail } from "lucide-react";
import toast from "react-hot-toast";
import AuthImagePattern from "../components/AuthImagePattern";

const VerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  if (!email) {
    navigate("/signup");
    return null;
  }

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp) return toast.error("Please enter the verification code");

    const apiUrl = import.meta.env.VITE_API_URL;
    console.log("API URL from env:", apiUrl);
    
    if (!apiUrl) {
      console.error("API URL is not configured. Please check your .env file");
      toast.error("Server configuration error. Please try again later.");
      return;
    }

    setIsVerifying(true);
    try {
      const fullUrl = `${apiUrl}/api/auth/verify-email`;
      console.log("Sending verification request to:", fullUrl);
      console.log("Request payload:", { email, otp });

      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ email, otp }),
      });

      console.log("Response status:", response.status);
      console.log("Response headers:", Object.fromEntries(response.headers.entries()));

      const contentType = response.headers.get("content-type");
      console.log("Content-Type:", contentType);

      let data;
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
        console.log("Parsed JSON response:", data);
      } else {
        const text = await response.text();
        console.log("Raw response text:", text);
        throw new Error("Server returned non-JSON response");
      }

      if (!response.ok) {
        throw new Error(data.message || "Verification failed");
      }

      toast.success(data.message || "Email verified successfully");
      navigate("/login");
    } catch (error) {
      console.error("Verification error:", error);
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      if (error.message === "Failed to fetch") {
        toast.error("Unable to connect to the server. Please check if the backend server is running.");
      } else if (error.message === "Server returned non-JSON response") {
        toast.error("Server returned an invalid response format. Please try again.");
      } else {
        toast.error(error.message || "Verification failed. Please try again.");
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to resend verification code");
      }

      toast.success("Verification code sent successfully");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* left side */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* LOGO */}
          <div className="text-center mb-8">
            <div className="flex flex-col items-center gap-2 group">
              <div
                className="size-12 rounded-xl bg-primary/10 flex items-center justify-center 
              group-hover:bg-primary/20 transition-colors"
              >
                <Mail className="size-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mt-2">Verify Your Email</h1>
              <p className="text-base-content/60">
                We've sent a verification code to {email}
              </p>
            </div>
          </div>

          <form onSubmit={handleVerify} className="space-y-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Verification Code</span>
              </label>
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isVerifying}>
              {isVerifying ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify Email"
              )}
            </button>
          </form>

          <div className="text-center">
            <p className="text-base-content/60">
              Didn't receive the code?{" "}
              <button
                onClick={handleResendOTP}
                disabled={isResending}
                className="link link-primary"
              >
                {isResending ? (
                  <>
                    <Loader2 className="size-4 animate-spin inline mr-1" />
                    Resending...
                  </>
                ) : (
                  "Resend Code"
                )}
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* right side */}
      <AuthImagePattern
        title="Verify Your Email"
        subtitle="Please check your email for the verification code to complete your registration."
      />
    </div>
  );
};

export default VerificationPage; 