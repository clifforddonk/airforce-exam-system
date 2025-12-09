import User from "@/models/User";

const GROUP_SIZE = 5;

export async function getNextGroup(): Promise<number> {
  const count = await User.countDocuments({ role: "student" });
  return Math.ceil((count + 1) / GROUP_SIZE);
}
