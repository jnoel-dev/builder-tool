"use client";

import { useState } from 'react';
import ElementsMenu from "./elementsMenu/ElementsMenu";
import MenuBase from "./menuBase/MenuBase";
import SettingsMenu from './settingsMenu/SettingsMenu';
import NavigationMenu from './navigationMenu/NavigationMenu';
import CSPMenu from './cspMenu/CSPMenu';

export default function SideMenu() {
  const [expanded, setExpanded] = useState<string | false>(false);

  return (
    <div
      style={{
        width: "auto",
        position: "fixed",
        right: 0,
        top: 0,
        height: "100%",
        overflowY: "auto",
        minWidth: "475px"
      }}
    >
      <MenuBase
        menuName="Elements"
        menuComponent={ElementsMenu}
        expanded={expanded}
        setExpanded={setExpanded}
      />
      <MenuBase
        menuName="Navigation"
        menuComponent={NavigationMenu}
        expanded={expanded}
        setExpanded={setExpanded}
      />
      <MenuBase
        menuName="CSP"
        menuComponent={CSPMenu}
        expanded={expanded}
        setExpanded={setExpanded}
      />
      <MenuBase
        menuName="Settings"
        menuComponent={SettingsMenu}
        expanded={expanded}
        setExpanded={setExpanded}
      />
    </div>
  );
}
