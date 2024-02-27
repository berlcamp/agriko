"use client";
import TopBar from "@/components/TopBar";
import { MainSideBar, Sidebar, Title, Unauthorized } from "@/components/index";
import { useSupabase } from "@/context/SupabaseProvider";
import React, { useEffect, useState } from "react";

import type { UserAccessTypes } from "@/types/index";
import { logError } from "@/utils/fetchApi";
import ChooseUsers from "./ChooseUsers";
import { superAdmins } from "@/constants";

const Page: React.FC = () => {
  const [users, setUsers] = useState<UserAccessTypes[] | []>([]);
  const [loadedSettings, setLoadedSettings] = useState(false);
  const { supabase, session } = useSupabase();

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from("agriko_system_access")
        .select("*, agriko_user:user_id(id,firstname,lastname,middlename)");

      if (error) {
        void logError("system access", "system_access", "", error.message);
        throw new Error(error.message);
      }

      setUsers(data);

      setLoadedSettings(true);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  if (!superAdmins.includes(session.user.email)) return <Unauthorized />;

  return (
    <>
      <Sidebar>
        <MainSideBar />
      </Sidebar>
      <TopBar />
      <div className="app__main">
        <div>
          <div className="app__title">
            <Title title="System Permissions" />
          </div>

          <div className="app__content pb-20">
            {loadedSettings && (
              <>
                <ChooseUsers
                  multiple={true}
                  type="collections"
                  users={users}
                  title="Who can access Ceedo Collections System"
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
export default Page;
