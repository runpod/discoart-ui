import globalHook from "use-global-hook"

const initialState = {
  showHelp: false,
}

const actions = {
  toggleHelp: (store) => {
    store.setState({ showHelp: !store.state.showHelp })
  },
}

export const useGlobalHelp = globalHook(initialState, actions)
