import React from "react"
import Panel from "../../addableElements/panels/panel/Panel"
import Container from "../../addableElements/frames/container/Container"
import PanelSVG from "../../addableElements/panels/panelSVG/PanelSVG"
import Input from "../../addableElements/inputs/input/Input"
import InputReact from "../../addableElements/inputs/inputReact/InputReact"
import InputComplex from "../../addableElements/inputs/inputComplex/InputComplex"
import InputRedraw from "../../addableElements/inputs/inputRedraw/InputRedraw"
import Frame from "@/components/addableElements/frames/frame/Frame"
import ShadowRoot from "@/components/addableElements/frames/shadowRoot/ShadowRoot"
import PanelCanvas from "@/components/addableElements/panels/panelCanvas/PanelCanvas"
import DialogNative from "@/components/addableElements/dialogs/dialogNative/DialogNative"

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

  PanelCanvas: {
    component: PanelCanvas,
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

  IframeCrossDomain: {
    component: Frame,
    neededProps: { frameType: "crossDomain" },
  },
  ShadowRootOpen: {
    component: ShadowRoot,
    neededProps: { shadowRootType: "open" },
  },
  ShadowRootClosed: {
    component: ShadowRoot,
    neededProps: { shadowRootType: "closed" },
  },
  DialogNative: {
    component: DialogNative,
  },

}

export default componentRegistry
