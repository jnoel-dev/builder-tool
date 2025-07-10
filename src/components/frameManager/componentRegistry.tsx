import React from "react"
import Panel from "../addableElements/Panel/Panel"
import Container from "../addableElements/Container/Container"

interface ComponentEntry {
  component: React.ComponentType<any>
  neededProps?: { [key: string]: any }
}

const componentRegistry: { [key: string]: ComponentEntry } = {
  Panel: {
    component: Panel,
  },

  ContainerVertical: {
    component: Container,
    neededProps: { containerType: "vertical" },
  },
}

export default componentRegistry
