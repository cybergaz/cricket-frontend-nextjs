import { ReactNode, useState } from "react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { ShieldCheck, X } from "lucide-react";
import { getCookie } from "@/lib/helper";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
type Role = 'marketing' | 'financial' | 'super_admin' | 'user'

const UpdateRole = ({ children, user_id }: { children: React.ReactNode, user_id: string }) => {

  const [showPromotePopup, setShowPromotePopup] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role>('marketing');

  const handlePromote = async () => {
    try {
      const token = getCookie("token");
      if (!token) {
        toast.error("Please login again");
        return;
      }

      const response = await fetch(`${BACKEND_URL}/admin/promote-user-to-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: user_id,
          role: selectedRole,
        }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`successfully updated role to ${selectedRole}`);
        setShowPromotePopup(false);
        setSelectedRole('marketing');
      } else {
        toast.error(data.message || "Failed to promote user to admin");
      }
    } catch (error) {
      console.error("Error promoting user:", error);
      toast.error("An error occurred while promoting user");
    }
  };

  return (
    <>
      <Button
        onClick={() => setShowPromotePopup(true)}
        className="flex justify-center items-center sm:ml-auto bg-purple-800 hover:bg-purple-900"
      >
        <ShieldCheck className="" />
        {children}
      </Button>

      {showPromotePopup && (
        <div className="fixed inset-0 w-screen h-screen justify-center flex items-center bg-black/30 backdrop-blur-xs z-50 p-4">
          <div
            onClick={() => setShowPromotePopup(false)}
            className="fixed inset-0 w-screen h-screen z-40"
          />
          <div className="z-50 bg-[#181a20] border-2 rounded-2xl border-[#4c6590]/20 p-4 sm:p-5 flex flex-col gap-5 max-w-md">
            <div className="mb-5 flex justify-between items-center">
              <h1 className="font-bold">Promote to Admin</h1>
              <X
                onClick={() => setShowPromotePopup(false)}
                className="size-7 rounded-lg p-1 hover:bg-blue-900 cursor-pointer"
              />
            </div>
            <div className="flex gap-2 justify-center items-center">
              <label className="text-sm font-medium">Select Role</label>
              <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as Role)}>
                <SelectTrigger className="p-2 rounded-lg border bg-gray-400/10 border-gray-300/20 focus:outline-none focus:ring-2 focus:ring-white">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-[#181a20] border border-gray-300/20">
                  <SelectItem value="marketing">Marketing Admin</SelectItem>
                  <SelectItem value="financial">Financial Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="user">Normal User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 mt-5">
              <Button
                onClick={handlePromote}
                className="bg-purple-800 hover:bg-purple-900 text-white w-fit h-fit py-2 px-4 rounded-lg cursor-pointer"
              >
                Confirm Promotion
              </Button>
              <Button
                onClick={() => setShowPromotePopup(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white w-fit h-fit py-2 px-4 rounded-lg cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

    </>

  )
}

export { UpdateRole } 
