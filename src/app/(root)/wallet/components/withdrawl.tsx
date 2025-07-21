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
            newErrors.amount = "Enter a valid amount";
        }
        if (!formData.accountName.trim()) {
            newErrors.accountName = "Account name is required";
        }
        if (!formData.accountNumber.match(/^\d{8,20}$/)) {
            newErrors.accountNumber = "Enter a valid account number (8-20 digits)";
        }
        if (!formData.ifsc.match(/^[A-Z]{4}0[A-Z0-9]{6}$/i)) {
            newErrors.ifsc = "Enter a valid IFSC code";
        }
        if (!formData.bankName.trim()) {
            newErrors.bankName = "Bank name is required";
        }
        if (!formData.email.match(/^\S+@\S+\.\S+$/)) {
            newErrors.email = "Enter a valid email address";
        }
        if (!formData.phone.match(/^\d{10}$/)) {
            newErrors.phone = "Enter a valid 10-digit phone number";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        const toastID = toast.loading("Sending Withdrawl Request...")
        setTimeout(() => {
            toast.success("Withdrawl Request Sent");
            toast.dismiss(toastID)
        }, 1500);
        console.log(formData);
        handleClose();
    };

    return (
        <div>
            <Button
                onClick={() => { handleOpen() }}
                className="bg-orange-500/50 hover:bg-orange-600 text-white font-semibold px-6 py-2"
            >
                Withdraw
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={e => {
                    if (e.target === e.currentTarget) handleClose();
                }}>
                    <div className="bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-8 relative" onClick={e => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold mb-6">
                            Withdraw Money
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    required
                                    className="w-full border-0 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                                    placeholder="Enter Amount"
                                    aria-label="Amount"
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
                                    className="w-full border-0 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                                    placeholder="Account Name"
                                    aria-label="Account Name"
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
                                    className="w-full border-0 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                                    placeholder="Account Number"
                                    aria-label="Account Number"
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
                                    className="w-full border-0 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30 uppercase"
                                    placeholder="IFSC Code"
                                    aria-label="IFSC Code"
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
                                    className="w-full border-0 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                                    placeholder="Bank Name"
                                    aria-label="Bank Name"
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
                                    className="w-full border-0 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                                    placeholder="Email Address"
                                    aria-label="Email Address"
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
                                    className="w-full border-0 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-white/30"
                                    placeholder="Phone Number"
                                    aria-label="Phone Number"
                                    maxLength={10}
                                />
                                {errors.phone && <div className="text-red-500 text-sm mt-1">{errors.phone}</div>}
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
    );
}