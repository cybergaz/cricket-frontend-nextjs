import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function WithdrawModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    accountNumber: "",
    accountName: "",
    ifsc: "",
    bankName: "",
    email: "",
    phone: "",
    aadhar: "",
    pan: "",
  });
  const [errors, setErrors] = useState<any>({});

  const handleOpen = () => setIsOpen(true);
  const handleClose = () => setIsOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const validate = () => {
    const newErrors: any = {};
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      newErrors.amount = "Enter the amount you wish to withdraw (e.g., 1000)";
    }
    if (!formData.accountName.trim()) {
      newErrors.accountName = "Enter the account holder's name as per your bank records (e.g., Rahul Sharma)";
    }
    if (!formData.accountNumber.match(/^\d{8,20}$/)) {
      newErrors.accountNumber = "Enter your bank account number (8-20 digits, e.g., 123456789012)";
    }
    if (!formData.ifsc.match(/^[A-Z]{4}0[A-Z0-9]{6}$/i)) {
      newErrors.ifsc = "Enter your bank's IFSC code (e.g., HDFC0001234)";
    }
    if (!formData.bankName.trim()) {
      newErrors.bankName = "Enter your bank's name (e.g., HDFC Bank)";
    }
    if (!formData.email.match(/^\S+@\S+\.\S+$/)) {
      newErrors.email = "Enter your email address (e.g., user@example.com)";
    }
    if (!formData.phone.match(/^\d{10}$/)) {
      newErrors.phone = "Enter your 10-digit mobile number (e.g., 9876543210)";
    }
    if (!formData.aadhar.match(/^\d{12}$/)) {
      newErrors.aadhar = "Enter your 12-digit Aadhar number (e.g., 123412341234)";
    }
    if (!formData.pan.match(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)) {
      newErrors.pan = "Enter your PAN number (e.g., ABCDE1234F)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setFormData({
      amount: "",
      accountName: "",
      accountNumber: "",
      ifsc: "",
      bankName: "",
      email: "",
      phone: "",
      aadhar: "",
      pan: "",
    });
    setIsOpen(false)
    const toastID = toast.loading("Sending Withdrawal Request...");
    try {
      const getTokenFromCookies = () => {
        if (typeof document === "undefined") return null;
        const cookies = document.cookie.split("; ");
        const tokenCookie = cookies.find((cookie) => cookie.startsWith("token="));
        return tokenCookie ? tokenCookie.split("=")[1] : null;
      };
      const token = getTokenFromCookies();

      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/email/withdrawl-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Withdrawal Request Sent");
        setTimeout(() => {
          window.location.reload()
        }, 1000);
        handleClose();
      } else {
        toast.info(data?.message || "Failed to send withdrawal request");
      }
    } catch (err: any) {
      console.log(err)
    } finally {
      toast.dismiss(toastID);
    }
  };

  return (
    <div>
      <Button
        onClick={handleOpen}
        className="bg-orange-500/50 hover:bg-orange-600 text-white font-semibold px-6 py-2"
      >
        Withdraw
      </Button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div
            className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6">Withdraw Money</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Existing Fields */}
              {/* Same as before: Amount, Account Name, Account Number, IFSC, Bank Name, Email, Phone */}

              <div>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  required
                  className="w-full border-1 border-gray-600/60 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="Enter Amount"
                />
                {errors.amount && <div className="text-red-500 text-sm mt-1">{errors.amount}</div>}
              </div>

              <div>
                <input
                  type="text"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleChange}
                  required
                  className="w-full border-1 border-gray-600/60 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="Account Holder Name"
                />
                {errors.accountName && <div className="text-red-500 text-sm mt-1">{errors.accountName}</div>}
              </div>

              <div>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  required
                  className="w-full border-1 border-gray-600/60 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="Account Number"
                />
                {errors.accountNumber && <div className="text-red-500 text-sm mt-1">{errors.accountNumber}</div>}
              </div>

              <div>
                <input
                  type="text"
                  name="ifsc"
                  value={formData.ifsc}
                  onChange={handleChange}
                  required
                  className="w-full border-1 border-gray-600/60 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="IFSC Code"
                />
                {errors.ifsc && <div className="text-red-500 text-sm mt-1">{errors.ifsc}</div>}
              </div>

              <div>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  required
                  className="w-full border-1 border-gray-600/60 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="Bank Name"
                />
                {errors.bankName && <div className="text-red-500 text-sm mt-1">{errors.bankName}</div>}
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full border-1 border-gray-600/60 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="Email Address"
                />
                {errors.email && <div className="text-red-500 text-sm mt-1">{errors.email}</div>}
              </div>

              <div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full border-1 border-gray-600/60 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="Phone Number"
                  maxLength={10}
                />
                {errors.phone && <div className="text-red-500 text-sm mt-1">{errors.phone}</div>}
              </div>

              {/* New Aadhar Field */}
              <div>
                <input
                  type="text"
                  name="aadhar"
                  value={formData.aadhar}
                  onChange={handleChange}
                  required
                  maxLength={12}
                  className="w-full border-1 border-gray-600/60 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="Aadhar Card Number"
                />
                {errors.aadhar && <div className="text-red-500 text-sm mt-1">{errors.aadhar}</div>}
              </div>

              {/* New PAN Field */}
              <div>
                <input
                  type="text"
                  name="pan"
                  value={formData.pan}
                  onChange={handleChange}
                  required
                  maxLength={10}
                  className="w-full border-1 border-gray-600/60 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                  placeholder="PAN Card Number"
                />
                {errors.pan && <div className="text-red-500 text-sm mt-1">{errors.pan}</div>}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 transition cursor-pointer hover:bg-white hover:text-gray-800 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-orange-600 text-white font-semibold hover:bg-orange-700 transition cursor-pointer"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
