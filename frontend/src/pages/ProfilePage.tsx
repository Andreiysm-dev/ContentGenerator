import { useState } from "react";
import type { Session } from "@supabase/supabase-js";

interface ProfilePageProps {
  session: Session | null;
}

export function ProfilePage({ session }: ProfilePageProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);

  return (
    <main className="app-main">
      <section className="card">
        <div className="card-header mb-4 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <div className="text-md font-semibold text-gray-800">Personal Information</div>
            <p className="text-sm text-gray-500">Manage your personal details.</p>
          </div>

          <div className="flex gap-3 mt-1">
            <button onClick={() => setShowEdit(true)} className="btn btn-primary btn-sm">
              Edit Profile
            </button>
            <button onClick={() => setShowDelete(true)} className="btn btn-danger btn-sm">
              Delete Account
            </button>
          </div>
        </div>

        <div className="flex items-center gap-5 px-10 mb-5">
          <img src="https://i.pinimg.com/1200x/d4/a5/82/d4a5829f2d13dac1c9c0d00e4c19e1ad.jpg" alt="Profile" className="w-24 h-24 rounded-full object-cover border" />
          <div>
            <div className="text-md font-semibold text-gray-800">John Doe</div>
            <p className="text-gray-500 text-sm">johndoe@email.com</p>
          </div>
        </div>
      </section>

      {/* CREDENTIALS SECTION */}
      <section className="card mt-3">
        <div className="card-header flex items-start justify-between mb-4 border-b pb-4">
          <div className="flex flex-col gap-1">
            <div className="font-semibold text-gray-800">Account Credentials</div>
            <p className="text-sm text-gray-500">Manage your login email and password for your account.</p>
          </div>

          <div className="mt-1">
            <button onClick={() => setShowCredentials(true)} className="btn btn-primary btn-sm">
              Edit Credentials
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5 px-10 pb-4">
          <div>
            <label className="text-sm text-gray-500">Email</label>
            <div className="mt-1 p-2 border rounded-lg bg-gray-50 text-gray-500">johndoe@email.com</div>
          </div>

          <div>
            <label className="text-sm text-gray-500">Password</label>
            <div className="mt-1 p-2 border rounded-lg bg-gray-50 text-gray-500">••••••••</div>
          </div>
        </div>
      </section>

      {/* EDIT PROFILE MODAL */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="bg-[#5bb8f7] text-white text-center py-3 font-semibold text-lg">Edit Profile</div>

            <div className="p-6 space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-600">Profile Picture</label>

                <label className="flex items-center border border-gray-300 rounded-lg overflow-hidden cursor-pointer w-full">
                  <span className="px-4 py-2 text-sm border-r text-white bg-[#5bb8f7]">Choose File</span>
                  <span className="px-3 text-sm text-gray-500">No file selected</span>
                  <input type="file" className="hidden" />
                </label>
              </div>

              <div>
                <label className="text-sm text-gray-500">First Name</label>
                <input type="text" defaultValue="John" className="text-sm mt-1 w-full border border-gray-300 rounded-lg p-2" />
              </div>

              <div>
                <label className="text-sm text-gray-500">Last Name</label>
                <input type="text" defaultValue="Doe" className="text-sm mt-1 w-full border border-gray-300 rounded-lg p-2" />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowEdit(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>

                <button className="btn btn-primary btn-sm">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREDENTIALS MODAL */}
      {showCredentials && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md shadow-lg overflow-hidden">
            <div className="bg-[#5bb8f7] text-white text-center py-3 font-semibold text-lg">Edit Credentials</div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <input type="email" defaultValue="johndoe@email.com" className="mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm" />
              </div>

              <div>
                <label className="text-sm text-gray-500">Password</label>
                <input type="password" placeholder="Enter new password" className="mt-1 w-full border border-gray-300 rounded-lg p-2 text-sm" />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setShowCredentials(false)} className="btn btn-secondary btn-sm">
                  Cancel
                </button>

                <button className="btn btn-primary btn-sm">Save Credentials</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {showDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-lg overflow-hidden">
            <div className="bg-red-500 text-white text-center py-3 font-semibold">Delete Account</div>

            <div className="text-sm px-6 pt-6 text-gray-500 mb-6 text-center">Are you sure you want to delete your account? This action cannot be undone.</div>

            <div className="pb-4 flex justify-center gap-3">
              <button onClick={() => setShowDelete(false)} className="btn btn-secondary btn-sm">
                Cancel
              </button>

              <button className="btn btn-danger btn-sm">Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
