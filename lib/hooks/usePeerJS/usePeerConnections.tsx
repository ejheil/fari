import Peer from "peerjs";
import { useEffect, useRef, useState } from "react";
import { IPeerAction } from "./IPeerAction";
import { usePeerJS } from "./usePeerJS";

export function usePeerConnections(options: {
  onHostDataReceive: (data: any) => void;
  debug?: boolean;
}) {
  const { peer, loading } = usePeerJS({ debug: options.debug });
  const connection = useRef<Peer.DataConnection | undefined>(undefined);
  const [connectionToHost, setConnectionToHost] = useState<
    Peer.DataConnection | undefined
  >(undefined);
  const [connectingToHost, setConnectingToHost] = useState(false);
  const [connectingToHostError, setConnectingToHostError] = useState(false);

  const latestPeer = useRef(peer);
  const latestOnHostDataReceive = useRef(options.onHostDataReceive);

  useEffect(() => {
    latestPeer.current = peer;
    latestOnHostDataReceive.current = options.onHostDataReceive;
  });

  useEffect(() => {
    return subscribeForEvents();

    function subscribeForEvents() {
      latestPeer.current.on("error", onPeerErrorCallback);
      return () => {
        latestPeer.current.off("error", onPeerErrorCallback);
        connection.current?.off("open", onHostConnectionOpen);
        connection.current?.off("close", onHostConnectionClose);
        connection.current?.off("data", onHostDataReceive);
      };
    }
  }, []);

  function onPeerErrorCallback(error: any) {
    if (error.type === "peer-unavailable") {
      setConnectingToHostError(true);
      setConnectingToHost(false);
    }
  }

  function onHostConnectionOpen() {
    setConnectionToHost(connection.current);
    setConnectingToHost(false);
    console.info("usePeerConnections: Connected To Host");
  }

  function onHostConnectionClose() {
    setConnectionToHost(undefined);
    setConnectingToHost(false);
    console.info("usePeerConnections: Disconnected From Host");
  }

  function onHostDataReceive(data: any) {
    latestOnHostDataReceive.current(data);
  }

  return {
    state: {
      isConnectedToHost: !!connectionToHost,
      connectingToHost,
      loading,
      connectingToHostError,
    },
    actions: {
      connect<T>(id: string, userId: string, metadata?: T) {
        console.info("Connection: Setup");
        setConnectingToHost(true);
        setConnectingToHostError(false);
        connection.current = peer.connect(id, {
          reliable: true,
          label: userId,
          metadata: metadata,
        });
        connection.current.on("open", onHostConnectionOpen);
        connection.current.on("close", onHostConnectionClose);
        connection.current.on("data", onHostDataReceive);
      },
      sendToHost<TPeerAction extends IPeerAction<string, unknown>>(
        request: TPeerAction
      ) {
        connectionToHost?.send(request);
      },
    },
  };
}
