// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import DashboardLayout from "@/components/DashboardLayout";

export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    business_name: "",
    logo_url: "",
    abn: "",
    address: "",
    email: "",
    phone: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    // Get the profile or create one
    const { data: existing } = await supabase
      .from("company_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!existing) {
      const { data: created } = await supabase
        .from("company_profiles")
        .insert([{ user_id: user.id }])
        .select()
        .single();

      setProfile(created);
    } else {
      setProfile(existing);
    }

    setLoading(false);
  }

  async function uploadLogo(userId: string) {
    if (!logoFile) return profile.logo_url;

    const fileExt = logoFile.name.split(".").pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;

    await supabase.storage.from("company-logos").upload(filePath, logoFile, {
      upsert: true,
    });

    const { data } = supabase.storage
      .from("company-logos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function saveProfile() {
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const logo_url = await uploadLogo(user.id);

    const updateData = {
      ...profile,
      logo_url,
    };

    await supabase
      .from("company_profiles")
      .update(updateData)
      .eq("user_id", user.id);

    setSaving(false);
    alert("Saved");
  }

  if (loading)
    return (
      <DashboardLayout>
        <div className="text-white p-6">Loading...</div>
      </DashboardLayout>
    );

  return (
    <DashboardLayout>
      <div className="p-6 text-white max-w-2xl">
        <h1 className="text-2xl font-semibold mb-6">Company Profile</h1>

        <div className="space-y-4 bg-neutral-900 p-5 rounded-lg border border-neutral-800">
          {/* Business Name */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Business Name
            </label>
            <input
              value={profile.business_name || ""}
              onChange={(e) =>
                setProfile({ ...profile, business_name: e.target.value })
              }
              className="w-full px-3 py-2 bg-neutral-800 rounded border border-neutral-700"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Company Logo
            </label>

            {profile.logo_url && (
              <img
                src={profile.logo_url}
                alt="Logo"
                className="h-20 mb-3 rounded border border-neutral-700"
              />
            )}

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              className="text-sm"
            />
          </div>

          {/* ABN */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">ABN</label>
            <input
              value={profile.abn || ""}
              onChange={(e) => setProfile({ ...profile, abn: e.target.value })}
              className="w-full px-3 py-2 bg-neutral-800 rounded border border-neutral-700"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Address</label>
            <input
              value={profile.address || ""}
              onChange={(e) =>
                setProfile({ ...profile, address: e.target.value })
              }
              className="w-full px-3 py-2 bg-neutral-800 rounded border border-neutral-700"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              value={profile.email || ""}
              onChange={(e) =>
                setProfile({ ...profile, email: e.target.value })
              }
              className="w-full px-3 py-2 bg-neutral-800 rounded border border-neutral-700"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm text-gray-300 mb-1">Phone</label>
            <input
              value={profile.phone || ""}
              onChange={(e) =>
                setProfile({ ...profile, phone: e.target.value })
              }
              className="w-full px-3 py-2 bg-neutral-800 rounded border border-neutral-700"
            />
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
