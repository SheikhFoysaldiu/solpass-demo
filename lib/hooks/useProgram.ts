import { AnchorProvider, Program, setProvider } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useMemo } from "react";

import { programId } from "@/lib/contants";
import { IDLType } from "@/lib/idl";
import idl from "@/lib/idl.json";

export function useProgram() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const program = useMemo(() => {
    if (!wallet) return null;

    const provider = new AnchorProvider(connection, wallet, {});
    setProvider(provider);
    // @ts-ignore
    return new Program(idl as IDLType, programId, provider);
  }, [connection, wallet]);

  return program;
}
