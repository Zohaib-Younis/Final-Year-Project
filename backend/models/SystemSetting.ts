import mongoose from "mongoose";

const systemSettingSchema = new mongoose.Schema(
  {
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    officerRestricted: {
      type: Boolean,
      default: false,
    },
    institutionName: {
      type: String,
      default: "Superior University",
    },
    appName: {
      type: String,
      default: "SuperiorVote",
    },
    appLogo: {
      type: String,
      default: null,
    },
    timezone: {
      type: String,
      default: "Pakistan Standard Time (GMT+5)",
    },
  },
  {
    timestamps: true,
  }
);

const SystemSetting = mongoose.model("SystemSetting", systemSettingSchema);

export default SystemSetting;
