"use client";
import React, { type ChangeEvent, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useFilter } from "@/context/FilterContext";
import { useSupabase } from "@/context/SupabaseProvider";
import OneColLayoutLoading from "./Loading/OneColLayoutLoading";
import Avatar from "react-avatar";
import Image from "next/image";

// Redux imports
import { useSelector, useDispatch } from "react-redux";
import { updateList } from "@/GlobalRedux/Features/listSlice";

import { generateReferenceCode } from "@/utils/text-helper";
import { useRouter } from "next/navigation";
import { AccountTypes } from "@/types/index";

interface ModalProps {
  hideModal: () => void;
  id: string;
  shouldUpdateRedux: boolean;
}

const AccountDetails = ({ hideModal, shouldUpdateRedux, id }: ModalProps) => {
  const { setToast } = useFilter();
  const { supabase, session } = useSupabase();

  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [department, setDepartment] = useState("");

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value);
  const dispatch = useDispatch();

  const {
    register,
    formState: { errors },
    reset,
    handleSubmit,
  } = useForm<AccountTypes>({
    mode: "onSubmit",
  });

  const onSubmit = async (formdata: AccountTypes) => {
    if (loading || saving) return;

    void handleUpdate(formdata);
  };

  const handleUpdate = async (formdata: AccountTypes) => {
    setSaving(true);

    const newData = {
      firstname: formdata.firstname,
      middlename: formdata.middlename,
      lastname: formdata.lastname,
    };
    try {
      const { error } = await supabase
        .from("agriko_users")
        .update(newData)
        .eq("id", id);

      if (error) throw new Error(error.message);
    } catch (e) {
      console.error(e);
    } finally {
      // Update data in redux
      if (shouldUpdateRedux) {
        const items = [...globallist];
        const updatedData = { ...newData, id };
        const foundIndex = items.findIndex((x) => x.id === updatedData.id);
        items[foundIndex] = { ...items[foundIndex], ...updatedData };
        dispatch(updateList(items));
      }

      // pop up the success message
      setToast("success", "Successfully saved.");

      setSaving(false);

      // hide the modal
      hideModal();
    }
  };

  const handleUploadPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      try {
        setUploading(true);

        // delete the existing user avatar on supabase storage
        const { data: files, error: error3 } = await supabase.storage
          .from("agriko_public")
          .list(`user_avatar/${id}`);

        if (error3) throw new Error(error3.message);
        if (files.length > 0) {
          const filesToRemove = files.map(
            (x: { name: string }) => `user_avatar/${id}/${x.name}`
          );
          const { error: error4 } = await supabase.storage
            .from("agriko_public")
            .remove(filesToRemove);
          if (error4) throw new Error(error4.message);
        }

        // upload the new avatar
        const file = e.target.files?.[0];
        const newFileName = generateReferenceCode();
        const customFilePath =
          `user_avatar/${id}/${newFileName}.` +
          (file.name.split(".").pop() as string);
        const { error } = await supabase.storage
          .from("agriko_public")
          .upload(`${customFilePath}`, file, {
            cacheControl: "3600",
            upsert: true,
          });
        if (error) throw new Error(error.message);

        // get the newly uploaded file public path
        await handleFetchAvatar(customFilePath);
      } catch (error) {
        console.error("Error uploading file:", error);
      } finally {
        router.refresh();
        setUploading(false);
      }
    }
  };

  const handleFetchAvatar = async (path: string) => {
    try {
      // get the public avatar url
      const { data, error } = await supabase.storage
        .from("agriko_public")
        .getPublicUrl(`${path}`);

      if (error) throw new Error(error.message);

      // update avatar url on agriko_users table
      const { error2 } = await supabase
        .from("agriko_users")
        .update({ avatar_url: data.publicUrl })
        .eq("id", id);

      if (error2) throw new Error(error2.message);

      setAvatarUrl(data.publicUrl);
    } catch (error) {
      console.error("Error fetching avatar:", error);
    }
  };

  // manually set the defaultValues of use-form-hook whenever the component receives new props.
  useEffect(() => {
    const fetchAccountDetails = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("agriko_users")
          .select("*", {
            count: "exact",
          })
          .eq("id", id)
          .limit(1)
          .maybeSingle();

        if (error) throw new Error(error.message);

        setAvatarUrl(data.avatar_url);

        reset({
          firstname: data ? data.firstname : "",
          middlename: data ? data.middlename : "",
          lastname: data ? data.lastname : "",
        });
      } catch (e) {
        console.error("fetch error: ", e);
      } finally {
        setLoading(false);
      }
    };

    void fetchAccountDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, reset]);

  return (
    <>
      <div className="app__modal_wrapper">
        <div className="app__modal_wrapper2">
          <div className="app__modal_wrapper3">
            <div className="app__modal_header">
              <h5 className="app__modal_header_text">Account Details</h5>
              <button
                disabled={saving}
                onClick={hideModal}
                type="button"
                className="app__modal_header_btn"
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="app__modal_body">
              {loading && <OneColLayoutLoading />}
              {!loading && (
                <form onSubmit={handleSubmit(onSubmit)} className="">
                  <div className="text-center">
                    {avatarUrl && avatarUrl !== "" ? (
                      <Image
                        src={avatarUrl}
                        width={60}
                        height={60}
                        alt="alt"
                        className="mx-auto"
                      />
                    ) : (
                      <Avatar
                        round={false}
                        size="60"
                        name={session.user.email.split("@")[0]}
                      />
                    )}
                    <div className="relative">
                      <input
                        type="file"
                        onChange={handleUploadPhoto}
                        className="hidden"
                        id="file-input"
                        accept="image/*"
                      />
                      {!uploading ? (
                        <label
                          htmlFor="file-input"
                          className="cursor-pointer py-px px-1 text-xs text-blue-600"
                        >
                          Change Profile Photo
                        </label>
                      ) : (
                        <span className="py-px px-1 text-xs text-blue-600">
                          Uploading...
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">First Name:</div>
                      <div>
                        <input
                          {...register("firstname", { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.name && (
                          <div className="app__error_message">
                            Firstname is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Middlename:</div>
                      <div>
                        <input
                          {...register("middlename")}
                          type="text"
                          className="app__input_standard"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="app__form_field_container">
                    <div className="w-full">
                      <div className="app__label_standard">Lastname:</div>
                      <div>
                        <input
                          {...register("lastname", { required: true })}
                          type="text"
                          className="app__input_standard"
                        />
                        {errors.name && (
                          <div className="app__error_message">
                            Lastname is required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="app__modal_footer">
                    <button type="submit" className="app__btn_green_sm">
                      {saving ? "Saving.." : "Save"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AccountDetails;
