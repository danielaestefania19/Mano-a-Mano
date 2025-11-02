import { useEnsName, useEnsAvatar } from "wagmi";
import { mainnet } from "wagmi/chains";

export default function EnsOrAddress({ address, size = 32 }: { address: `0x${string}`; size?: number }) {
  const { data: ensName } = useEnsName({
    address,
    chainId: mainnet.id, 
  });

  const { data: ensAvatar } = useEnsAvatar({
    name: ensName ?? undefined,
    chainId: mainnet.id, 
  });

  const fallbackAvatar = `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${address}`;
  const avatarUrl = ensAvatar || fallbackAvatar;

  return (
    <div className="flex items-center gap-2">
      <img
        src={avatarUrl}
        alt={ensName ?? address}
        width={size}
        height={size}
        className="rounded-full border border-gray-200 object-cover shadow-sm"
      />
      <span className="text-sm font-medium text-gray-700">
        {ensName ?? `${address.slice(0, 6)}...${address.slice(-4)}`}
      </span>
      {!ensName && <span className="text-xs text-gray-400 ml-1">(sin ENS)</span>}
    </div>
  );
}
