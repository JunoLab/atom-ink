'use babel';

import { createStore, combineReducers } from 'redux';

const ADD_TERMINAL = 'TERMINALS/ADD';
const UPDATE_TERMINAL = 'TERMINALS/UPDATE';
const REMOVE_TERMINAL = 'TERMINALS/REMOVE';
const SET_ACTIVE_TERMINAL = 'TERMINALS/SET_ACTIVE';

class AutoIncrement {
  nextInt = 1;

  next() {
    const out = this.nextInt;
    this.nextInt += 1;
    return out;
  }
}

const idCounter = new AutoIncrement();

function addTerminal(t) {
  const terminal = { ...t };
  terminal.open = function open() {
    this.term.focusAndActivatePane();
  };
  terminal.id = idCounter.next();
  return {
    type: ADD_TERMINAL,
    terminal,
  };
}

function updateTerminal(terminal) {
  if (terminal.id == null) {
    throw new Error('terminal update must include id');
  }
  return {
    type: UPDATE_TERMINAL,
    terminal,
  };
}

function removeTerminal(terminal) {
  return {
    type: REMOVE_TERMINAL,
    terminal,
  };
}

function setActiveTerminal(activeTerminal) {
  return {
    type: SET_ACTIVE_TERMINAL,
    activeTerminalId: activeTerminal == null ? null : activeTerminal.id,
  };
}

function terminals(state = [], action) {
  const t = action.terminal;
  switch (action.type) {
    case ADD_TERMINAL: {
      if (state.find(u => u.id === t.id)) return state;
      const newState = state.slice();
      newState.push(t);
      return newState;
    }

    case UPDATE_TERMINAL:
      return state.map(u => {
        if (u.id === t.id) {
          return Object.assign({}, u, t);
        }
        return u;
      });

    case REMOVE_TERMINAL:
      return state.filter(u => u.id !== t.id);

    default:
      return state;
  }
}

function activeTerminalId(state = null, action) {
  switch (action.type) {
    case SET_ACTIVE_TERMINAL:
      return action.activeTerminalId;
    default:
      return state;
  }
}

const reducer = combineReducers({ terminals, activeTerminalId });

const store = createStore(reducer, {});

store.addTerminal = terminal => store.dispatch(addTerminal(terminal));
store.updateTerminal = terminal => store.dispatch(updateTerminal(terminal));
store.removeTerminal = terminal => store.dispatch(removeTerminal(terminal));
store.setActiveTerminal = terminal =>
  store.dispatch(setActiveTerminal(terminal));

module.exports = store;
