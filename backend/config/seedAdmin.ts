import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";

/**
 * Seeds a default super-admin if the Admin collection is empty.
 * Change the credentials via environment variables:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_USERNAME
 */
export const seedAdmin = async () => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) return; // Already have admins

    const email = process.env.ADMIN_EMAIL || "admin@superior.edu.pk";
    const password = process.env.ADMIN_PASSWORD || "Admin@1234";
    const username = process.env.ADMIN_USERNAME || "Super Admin";

    const hashedPassword = await bcrypt.hash(password, 10);

    await Admin.create({
      username,
      email,
      password: hashedPassword,
      role: "admin",
      isSuperAdmin: true,
      isActive: true,
    });

    console.log(`\n✅  Default admin seeded`);
    console.log(`    Email:    ${email}`);
    console.log(`    Password: ${password}`);
    console.log(`    (Change credentials after first login)\n`);
  } catch (err) {
    console.error("Failed to seed admin:", err);
  }
};
