"use client";

import { useState } from "react";
import ElementsMenu from "./elementsMenu/ElementsMenu";
import MenuBase from "./menuBase/MenuBase";
import SettingsMenu from "./settingsMenu/SettingsMenu";
import NavigationMenu from "./navigationMenu/NavigationMenu";
import PropertiesMenu from "./propertiesMenu/PropertiesMenu";
import SnippetMenu from "./snippetMenu/SnippetMenu";

export default function SideMenu() {
  const [expanded, setExpanded] = useState<string | false>("Elements");

  return (
    <div>
      <MenuBase
        menuName="Elements"
        menuComponent={() => <ElementsMenu />}
        expanded={expanded}
        setExpanded={setExpanded}
      />
      <MenuBase
        menuName="Properties"
        menuComponent={({ expanded }) => PropertiesMenu(expanded)}
        expanded={expanded}
        setExpanded={setExpanded}
      />
      <MenuBase
        menuName="Navigation"
        menuComponent={() => <NavigationMenu />}
        expanded={expanded}
        setExpanded={setExpanded}
      />
      <MenuBase
        menuName="Snippet"
        menuComponent={() => <SnippetMenu />}
        expanded={expanded}
        setExpanded={setExpanded}
      />
      <MenuBase
        menuName="Settings"
        menuComponent={() => <SettingsMenu />}
        expanded={expanded}
        setExpanded={setExpanded}
      />
    </div>
  );
}
