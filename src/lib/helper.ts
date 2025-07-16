import { NextRequest } from "next/server";
import { useUserStore } from "@/store/user-store"; // adjust path
import { getTokenFromCookies } from "./actions";
import { resolve } from "dns";

export const validatePassword = (password: string): string => {
  if (!password) return "Password is required";

  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors: string[] = [];
  if (!minLength) errors.push("at least 8 characters");
  if (!hasUpperCase) errors.push("an uppercase letter");
  if (!hasLowerCase) errors.push("a lowercase letter");
  if (!hasNumber) errors.push("a number");
  if (!hasSpecialChar) errors.push("a special character");

  return errors.length > 0
    ? `Password must contain ${errors.join(", ")}`
    : "";
};

export const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(Number(amount))
}

export const validatePhone = (phone: string): string => {
  if (!phone) return "Phone number is required";

  const trimmedPhone = phone.replace(/\s+/g, "");

  if (trimmedPhone.startsWith("+91")) {
    const actualNumber = trimmedPhone.slice(3);
    if (!/^\d{10}$/.test(actualNumber)) {
      return "Phone number must be exactly 10 digits after +91";
    }
  } else {
    if (!/^\d{10}$/.test(trimmedPhone)) {
      return "Phone number must be exactly 10 digits";
    }
  }

  return "";
};

export const formatPhoneNumber = (phone: string): string => {
  const digits = phone.replace(/\D/g, "");

  // If it starts with 91 and is 12 digits long, keep the last 10 digits
  const tenDigitNumber = digits.length >= 10 ? digits.slice(-10) : digits;

  return `+91${tenDigitNumber}`;
};

const BASE62: string = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const SECRET_KEY: bigint = BigInt(0xa3b1c2d3);

function base62Encode(num: number | bigint): string {
  let encoded: string = "";
  const base: bigint = BigInt(62);
  num = BigInt(num);

  if (num === BigInt(0)) {
    return "0".padStart(8, "0");
  }

  while (num > BigInt(0)) {
    encoded = BASE62[Number(num % base)] + encoded;
    num = num / base;
  }
  return encoded.padStart(8, "0");
}

function base62Decode(str: string): bigint {
  let num: bigint = BigInt(0);
  const base: bigint = BigInt(62);

  for (let char of str) {
    const value: bigint = BigInt(BASE62.indexOf(char));
    num = num * base + value;
  }
  return num;
}

function encrypt(phoneNumber: string): string {
  if (!/^\d{12}$/.test(phoneNumber)) {
    throw new Error("Phone number must be exactly 12 digits.");
  }
  const num: bigint = BigInt(phoneNumber);
  const obfuscated: bigint = num ^ SECRET_KEY;
  return base62Encode(obfuscated);
}

function decrypt(cipherText: string): string {
  if (!/^[0-9A-Za-z]{8}$/.test(cipherText)) {
    throw new Error("Cipher text must be exactly 8 base62 characters.");
  }
  const decoded: bigint = base62Decode(cipherText);
  const original: bigint = decoded ^ SECRET_KEY;
  return original.toString().padStart(12, "0");
}

function generateAlphaCode(): string {
  const chars: string =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result: string = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface BackendResponse {
  status: number;
  message: string;
}

const isUserAdmin = async (request: NextRequest) => {
  const token = request.cookies.get("token")?.value;
  if (!token) {
    return { suceess: false, message: "No token found" };
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/is-admin`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data: BackendResponse = await response.json();
    if (response.status === 200) {
      return { success: true, message: "User is Admin" };
    } else {
      return { success: false, message: data.message || "User is not an admin" };
    }
  } catch (error) {
    return { success: false, message: "Error checking admin status" }
  }
};

export {
  isUserAdmin,
  generateAlphaCode,
  encrypt,
  decrypt,
  base62Decode,
  base62Encode
};

export const isAuthenticated = async (request: NextRequest) => {
  const token = request.cookies.get("token")?.value;
  return !!token;
};

export const setUserIntoGlobalStore = async (token: string) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/user`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (data && data.user) {
        // Map MongoDB user data to User type
        const mappedUser = {
          name: data.user.name,
          mobile: data.user.mobile,
          isVerified: data.user.isVerified,
          password: "", // We don't store password in frontend
          isAdmin: data.user.isAdmin,
          role: data.user.role,
          lastSeen: new Date(data.user.lastSeen),
          amount: data.user.amount,
          transactions: data.user.transactions || [],
          portfolio: data.user.portfolio || [],
          teamPortfolio: data.user.teamPortfolio || [],
          // Optional fields
          ...(data.user.googleId && { googleId: data.user.googleId }),
          ...(data.user.email && { email: data.user.email }),
          ...(data.user.profileImage && { profileImage: data.user.profileImage }),
          ...(data.user.referralCode && { referralCode: data.user.referralCode }),
          ...(data.user.referredBy && { referredBy: data.user.referredBy }),
        };

        useUserStore.getState().setUser(mappedUser);
        console.log("✅ User set in store:", mappedUser);
        console.log("User data set into global store:", useUserStore.getState());
      }
    }
  } catch (e) {
    console.error("Error setting user into global store", e);
  }
};

export const getCookie = (name: string): string | null => {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
};
