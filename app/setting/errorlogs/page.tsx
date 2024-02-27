"use client";

import { fetchErrorLogs } from "@/utils/fetchApi";
import React, { useEffect, useState } from "react";
import {
  Sidebar,
  PerPage,
  TopBar,
  TableRowLoading,
  ShowMore,
  Title,
  Unauthorized,
  MainSideBar,
} from "@/components/index";
import { superAdmins } from "@/constants";
import { useSupabase } from "@/context/SupabaseProvider";

// Redux imports
import { useSelector, useDispatch } from "react-redux";
import { updateList } from "@/GlobalRedux/Features/listSlice";
import { updateResultCounter } from "@/GlobalRedux/Features/resultsCounterSlice";
import { format } from "date-fns";

interface ErrorLogsTypes {
  created_at: string;
  system: string;
  transaction: string;
  table: string;
  data: string;
  error: string;
}
const Page: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<ErrorLogsTypes[] | []>([]);

  const [perPageCount, setPerPageCount] = useState<number>(10);

  // Redux staff
  const globallist = useSelector((state: any) => state.list.value);
  const resultsCounter = useSelector((state: any) => state.results.value);
  const dispatch = useDispatch();

  const { session } = useSupabase();

  const fetchData = async () => {
    setLoading(true);

    try {
      const result = await fetchErrorLogs(perPageCount, 0);

      // update the list in redux
      dispatch(updateList(result.data));

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: result.data.length,
          results: result.count ? result.count : 0,
        })
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Append data to existing list whenever 'show more' button is clicked
  const handleShowMore = async () => {
    setLoading(true);

    try {
      const result = await fetchErrorLogs(perPageCount, list.length);

      // update the list in redux
      const newList = [...list, ...result.data];
      dispatch(updateList(newList));

      // Updating showing text in redux
      dispatch(
        updateResultCounter({
          showing: newList.length,
          results: result.count ? result.count : 0,
        })
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Update list whenever list in redux updates
  useEffect(() => {
    setList(globallist);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globallist]);

  // Fetch data
  useEffect(() => {
    setList([]);
    void fetchData();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [perPageCount]);

  const isDataEmpty = !Array.isArray(list) || list.length < 1 || !list;

  // Check access from permission settings or Super Admins
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
            <Title title="Query Error Logs" />
          </div>

          {/* Per Page */}
          <PerPage
            showingCount={resultsCounter.showing}
            resultsCount={resultsCounter.results}
            perPageCount={perPageCount}
            setPerPageCount={setPerPageCount}
          />

          {/* Main Content */}
          <div>
            <table className="app__table">
              <thead className="app__thead">
                <tr>
                  <th className="app__th">Timestamp</th>
                  <th className="app__th">System</th>
                  <th className="app__th">Transaction</th>
                  <th className="hidden md:table-cell app__th">Table</th>
                  <th className="hidden md:table-cell app__th">Error</th>
                  <th className="hidden md:table-cell app__th">Data</th>
                </tr>
              </thead>
              <tbody>
                {!isDataEmpty &&
                  list.map((item, index) => (
                    <tr key={index} className="app__tr">
                      <td className="app__td">
                        <div>
                          {format(
                            new Date(item.created_at),
                            "MMM dd, yyyy h:mm aa"
                          )}
                        </div>
                      </td>
                      <td className="app__td">
                        <div>{item.system}</div>
                      </td>
                      <td className="app__td">
                        <div>{item.transaction}</div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <div>{item.table}</div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <div>{item.error}</div>
                      </td>
                      <td className="hidden md:table-cell app__td">
                        <div>{item.data}</div>
                      </td>
                    </tr>
                  ))}
                {loading && <TableRowLoading cols={5} rows={2} />}
              </tbody>
            </table>
            {!loading && isDataEmpty && (
              <div className="app__norecordsfound">No records found.</div>
            )}
          </div>

          {/* Show More */}
          {resultsCounter.results > resultsCounter.showing && !loading && (
            <ShowMore handleShowMore={handleShowMore} />
          )}
        </div>
      </div>
    </>
  );
};
export default Page;
