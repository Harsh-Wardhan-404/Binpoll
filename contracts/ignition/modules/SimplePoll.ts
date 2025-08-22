import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("SimplePollModule", (m) => {
  const simplePoll = m.contract("SimplePoll");

  return { simplePoll };
});
