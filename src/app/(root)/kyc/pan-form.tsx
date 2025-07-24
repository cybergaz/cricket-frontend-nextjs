"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function PanForm() {
  const [formData, setFormData] = useState({
    fullName: "",
    panNumber: "",
    dateOfBirth: "",
  });

  const [errors, setErrors] = useState<any>({});
  const [showPan, setShowPan] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.fullName || formData.fullName.length < 3) {
      newErrors.fullName = "Full name must be at least 3 characters.";
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(formData.panNumber)) {
      newErrors.panNumber = "Invalid PAN format (e.g., ABCDE1234F).";
    }
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required.";
    }
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    toast.success("PAN Submitted!");
    // console.log("Submitted data:", formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block mb-1">Holder's Name (as on PAN)</label>
          <input
            type="text"
            name="fullName"
            placeholder="Enter Full Name"
            className="w-full bg-gray-800 text-white p-2 rounded"
            value={formData.fullName}
            onChange={handleChange}
            required
          />
          {errors.fullName && (
            <p className="text-red-500 text-sm">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label className="block mb-1">Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            className="w-full bg-gray-800 text-white p-2 rounded"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
          />
          {errors.dateOfBirth && (
            <p className="text-red-500 text-sm">{errors.dateOfBirth}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block mb-1">PAN Number</label>
        <div className="relative">
          <input
            type={showPan ? "text" : "password"}
            name="panNumber"
            placeholder="Enter 10-character PAN number"
            className="w-full bg-gray-800 text-white p-2 pl-3 rounded pr-10"
            value={formData.panNumber}
            onChange={handleChange}
            required
          />
        </div>
        {errors.panNumber && (
          <p className="text-red-500 text-sm">{errors.panNumber}</p>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-gray-900 border-2 border-accent hover:bg-accent hover:text-white p-2 rounded"
      >
        Submit PAN Verification
      </button>
    </form>
  );
}
