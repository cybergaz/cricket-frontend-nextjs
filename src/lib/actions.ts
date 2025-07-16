import { z } from "zod"
import { toast } from "sonner"
import { CredentialResponse } from "@react-oauth/google";
import { setUserIntoGlobalStore } from "./helper";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

interface LoginResponse {
  success: boolean;
  message?: string;
}

const login = async (mobile: string, password: string): Promise<LoginResponse> => {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mobile, password }),
    });

    const data = await res.json();

    if (res.ok && data.token) {
      // localStorage.setItem("token", data.token);
      document.cookie = `token=${data.token}; path=/; secure;`;
      toast.success("Login successful! Welcome to Dashboard.");
      setUserIntoGlobalStore(data.token)
      return { success: true, message: data.message };
    }

    return {
      success: false,
      message: data.message || "Login failed",
    };
  } catch (error) {
    return {
      success: false,
      message: "Login failed",
    };
  }
};

type GoogleLoginResponse = {
  token: string;
  message: string;
};

const handleGoogleSuccess = async (
  credentialResponse: CredentialResponse
): Promise<{ success: boolean; message: string }> => {
  const tokenId = credentialResponse.credential;

  if (!tokenId) {
    toast.error("Google authentication failed!");
    return { success: false, message: "Missing credential token." };
  }

  try {
    const res = await fetch(`${BACKEND_URL}/auth/google-login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ tokenId }),
    });

    if (!res.ok) {
      throw new Error("Failed to login");
    }

    const data: GoogleLoginResponse = await res.json();

    if (data.token) {
      document.cookie = `token=${data.token}; path=/; secure;`;
      toast.success("Login successful! Welcome to Dashboard.");
      setUserIntoGlobalStore(data.token)
      window.location.href = "/home";
      return { success: true, message: data.message };
    }

    return { success: false, message: "No token returned from server." };
  } catch (error) {
    toast.error("Login failed. Please try again.");
    return { success: false, message: "Login request failed." };
  }
};


// Aadhar verification schema
const aadharSchema = z.object({
  fullName: z.string().min(3),
  aadharNumber: z.string().regex(/^\d{12}$/),
  dateOfBirth: z.string(),
  address: z.string().min(10),
})

// PAN verification schema
const panSchema = z.object({
  fullName: z.string().min(3),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/),
  dateOfBirth: z.string(),
  fatherName: z.string().min(3),
})

async function verifyAadhar(formData: FormData) {
  // Validate the form data
  const validatedFields = aadharSchema.safeParse({
    fullName: formData.get("fullName"),
    aadharNumber: formData.get("aadharNumber"),
    dateOfBirth: formData.get("dateOfBirth"),
    address: formData.get("address"),
  })

  if (!validatedFields.success) {
    return { success: false, error: validatedFields.error.flatten().fieldErrors }
  }

  // In a real application, you would:
  // 1. Hash the sensitive data before storing
  // 2. Use a secure API to verify the Aadhar details
  // 3. Store only what's necessary in your database

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Return success response
  return { success: true }
}

async function verifyPan(formData: FormData) {
  // Validate the form data
  const validatedFields = panSchema.safeParse({
    fullName: formData.get("fullName"),
    panNumber: formData.get("panNumber"),
    dateOfBirth: formData.get("dateOfBirth"),
    fatherName: formData.get("fatherName"),
  })

  if (!validatedFields.success) {
    return { success: false, error: validatedFields.error.flatten().fieldErrors }
  }

  // In a real application, you would:
  // 1. Hash the sensitive data before storing
  // 2. Use a secure API to verify the PAN details
  // 3. Store only what's necessary in your database

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000))

  // Return success response
  return { success: true }
}


const getTokenFromCookies = () => {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie.split("; ");
  console.log("Cookies:", cookies);
  const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));
  return tokenCookie ? tokenCookie.split("=")[1] : null;
};

export { login, handleGoogleSuccess, verifyAadhar, verifyPan, getTokenFromCookies }; 
