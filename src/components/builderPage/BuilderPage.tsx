"use client";

import SideMenu from "../sideMenu/SideMenu";
import SyncStatusWidget from "./syncStatusWidget/SyncStatusWidget";
import TopFrame from "./topFrame/TopFrame";

export default function BuilderPage() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "fixed",
        top: 0,
        right: 0,
        overflowY: "auto",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <TopFrame />
      <SyncStatusWidget />
      <SideMenu />
    </div>
  );
}
