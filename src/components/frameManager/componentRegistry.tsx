import React from "react"
import Panel from "../addableElements/panels/panel/Panel"
import Container from "../addableElements/frames/container/Container"
import PanelSVG from "../addableElements/panels/panelSVG/PanelSVG"
import Input from "../addableElements/elementController/inputs/input/Input"
import InputReact from "../addableElements/elementController/inputs/inputReact/InputReact"

interface ComponentEntry {
  component: React.ComponentType<any>
  neededProps?: { [key: string]: any }
}

const componentRegistry: { [key: string]: ComponentEntry } = {
  Panel: {
    component: Panel,
  },

  PanelSVG: {
    component: PanelSVG,
  },

  Input: {
    component: Input,
  },

  InputReact: {
    component: InputReact,
  },

  ContainerVertical: {
    component: Container,
    neededProps: { containerType: "vertical" },
  },

  ContainerHorizontal: {
    component: Container,
    neededProps: { containerType: "horizontal" },
  },
}

export default componentRegistry
