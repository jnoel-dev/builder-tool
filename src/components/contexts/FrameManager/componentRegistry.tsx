import React from "react"
import Panel from "../../addableElements/panels/panel/Panel"
import Container from "../../addableElements/frames/container/Container"
import PanelSVG from "../../addableElements/panels/panelSVG/PanelSVG"
import Input from "../../addableElements/inputs/input/Input"
import InputReact from "../../addableElements/inputs/inputReact/InputReact"
import InputComplex from "../../addableElements/inputs/inputComplex/InputComplex"
import InputRedraw from "../../addableElements/inputs/inputRedraw/InputRedraw"
import Frame from "@/components/addableElements/frames/frame/Frame"

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

  InputComplex: {
    component: InputComplex,
  },

  InputRedraw: {
    component: InputRedraw,
  },

  ContainerVertical: {
    component: Container,
    neededProps: { containerType: "vertical" },
  },

  ContainerHorizontal: {
    component: Container,
    neededProps: { containerType: "horizontal" },
  },

  IframeSameDomain: {
    component: Frame,
    neededProps: { frameType: "sameDomain" },
  },

}

export default componentRegistry
