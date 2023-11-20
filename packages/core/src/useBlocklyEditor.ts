import type { MutableRefObject } from 'react';
import { useEffect, useRef } from 'react';

import Blockly, { Workspace, WorkspaceSvg } from 'blockly';
import type { ToolboxDefinition } from 'blockly/core/utils/toolbox';

import { importFromJson } from './importFromJson';
import { importFromXml } from './importFromXml';
import type { UseBlocklyEditorType } from './types';

const useBlocklyEditor = ({
  workspaceConfiguration,
  toolboxConfiguration,
  initial,
  onError,
  onInject,
  onChange,
  onDispose,
  platform = 'web',
}: UseBlocklyEditorType): {
  workspace: WorkspaceSvg | null;
  xml: string | null;
  json: object | null;
  editorRef: MutableRefObject<HTMLDivElement | null>;
  toolboxConfig: ToolboxDefinition;
  updateToolboxConfig: (
    cb?: (configuration?: ToolboxDefinition) => ToolboxDefinition,
  ) => void;
  updateState: (data?: string | object) => void;
} => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const workspaceRef = useRef<WorkspaceSvg | null>(null);
  const xmlRef = useRef<string | null>(null);
  const jsonRef = useRef<object | null>(null);
  // we explicitly don't want to recreate the workspace when the configuration changes
  // so, we'll keep it in a ref and update as necessary in an effect hook
  const workspaceConfigurationRef = useRef(workspaceConfiguration);
  const toolboxConfigurationRef = useRef(toolboxConfiguration);

  // Workspace creation
  useEffect(() => {
    if (!editorRef.current || platform !== 'web') {
      return;
    }
    const workspace = Blockly.inject(editorRef.current, {
      ...workspaceConfigurationRef.current,
      toolbox: toolboxConfigurationRef.current,
    });
    workspaceRef.current = workspace;

    _onCallback(onInject, workspace);
    updateState(initial);
    workspace.addChangeListener(listener);

    // Dispose of the workspace when our div ref goes away (Equivalent to didComponentUnmount)
    return () => {
      workspace.removeChangeListener(listener);
      workspace.dispose();
      _onCallback(onDispose, workspace);
    };
    // eslint-disable-next-line
  }, []);

  function listener(event: Blockly.Events.Abstract) {
    if (!event.isUiEvent && workspaceRef.current) {
      _saveData(workspaceRef.current);
    }
  }

  function _onCallback(cb?: (arg?: any) => void, arg?: any) {
    if (cb) {
      cb(arg);
    }
  }

  function _saveData(workspace: Workspace): boolean {
    try {
      const newXml = Blockly.Xml.domToText(
        Blockly.Xml.workspaceToDom(workspace),
      );
      if (newXml !== xmlRef.current) {
        xmlRef.current = newXml;
        jsonRef.current = Blockly.serialization.workspaces.save(workspace);
        _onCallback(onChange, {
          workspace,
          xml: xmlRef.current,
          json: jsonRef.current,
        });
        return true;
      }
      return false;
    } catch (e) {
      _onCallback(onError, e);
      return false;
    }
  }

  function updateToolboxConfig(
    cb?: (configuration?: ToolboxDefinition) => ToolboxDefinition,
  ) {
    if (cb) {
      const configuration: ToolboxDefinition = cb(
        toolboxConfigurationRef.current,
      );
      if (
        configuration &&
        workspaceRef.current &&
        !workspaceConfigurationRef.current.readOnly
      ) {
        toolboxConfigurationRef.current = configuration;
        workspaceRef.current.updateToolbox(configuration);
      }
    }
  }

  function updateState(data?: string | object) {
    if (data && workspaceRef.current) {
      if (typeof data === 'string') {
        importFromXml(data as string, workspaceRef.current, onError);
      } else if (typeof data === 'object') {
        importFromJson(data as object, workspaceRef.current, onError);
      }
      _saveData(workspaceRef.current);
    }
  }

  return {
    workspace: workspaceRef.current,
    xml: xmlRef.current,
    json: jsonRef.current,
    editorRef,
    toolboxConfig: toolboxConfigurationRef.current as ToolboxDefinition,
    updateToolboxConfig,
    updateState,
  };
};

export { useBlocklyEditor };