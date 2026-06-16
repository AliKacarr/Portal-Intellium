const options = [
  {
    key: "addticket",
    label: "sidebar.addticket",
    leftIcon: "ion-plus",
    allowedRoles: ["admin", "worker", "user"],
  },
  {
    key: "tickets",
    label: "sidebar.tickets",
    leftIcon: "ion-clipboard",
    allowedRoles: ["admin", "worker", "user"],
  },
  {
    key: "my-profile1",
    label: "sidebar.profile",
    leftIcon: "ion-person",
    items: [
      {
        key: "my-profile-user",
        label: "sidebar.kisisel",
        allowedRoles: ["user", "worker-outsource"],
      },
      {
        key: "my-profile",
        label: "sidebar.kisisel",
        allowedRoles: ["admin", "worker"],
      },
      {
        key: "permission",
        label: "sidebar.izin",
        allowedRoles: ["admin", "worker", "worker-outsource"],
      },
      {
        key: "my-assets",
        label: "sidebar.zimmetbilgilerim",
        allowedRoles: ["admin", "worker", "worker-outsource"],
      },

      {
        key: "healthInfo",
        label: "sidebar.healthInfo",
        allowedRoles: ["admin", "worker", "worker-outsource"],
      },
      {
        key: "emergency-contact",
        label: "sidebar.acililetisim",
        allowedRoles: ["admin"],
      },
      {
        key: "documents",
        label: "sidebar.dokumanlar",
        allowedRoles: ["admin", "worker", "worker-outsource"],
      },
    ],
  },
  {
    key: "customerList",
    label: "sidebar.customer",
    leftIcon: "ion-briefcase",
    allowedRoles: ["admin"],
  },

  {
    key: "parameter",
    label: "parametre",
    leftIcon: "ion-settings",
    allowedRoles: ["admin"],
  },

  {
    key: "projectList",
    label: "sidebar.project",
    leftIcon: "ion-compose",
    allowedRoles: ["admin", "worker", "user"],
  },

  {
    key: "projectTeamList",
    label: "sidebar.projectTeam",
    leftIcon: "ion-person-stalker",
    allowedRoles: ["admin", "worker", "user"],
  },

  {
    key: "scrum-board",
    label: "sidebar.scrumboard",
    leftIcon: "ion-android-checkbox-outline",
    allowedRoles: ["admin", "worker", "user"],
  },
  {
    key: "UserList",
    label: "sidebar.UserList",
    leftIcon: "ion-happy",
    allowedRoles: ["admin"],
  },
  {
    key: "CreateUser",
    label: "sidebar.createUser",
    leftIcon: "ion-person-add",
    allowedRoles: ["admin"],
  },
  {
    key: "admin-healthInfo",
    label: "sidebar.healthInfo-Admin",
    leftIcon: "ion-laptop",
    allowedRoles: ["admin"],
  },
  {
    key: "my-expenses",
    label: "sidebar.masraf",
    leftIcon: "ion-card",
    allowedRoles: ["admin", "worker", "worker-outsource"],
  },
  {
    key: "requests",
    label: "sidebar.requests",
    leftIcon: "ion-android-list",
    allowedRoles: ["admin", "worker", "worker-outsource"],
  },
  {
    key: "notes",
    label: "sidebar.notes",
    leftIcon: "ion-document-text",
    allowedRoles: ["admin", "worker", "user", "worker-outsource"],
  },
  {
    key: "assets",
    label: "sidebar.zimmetbilgileri",
    leftIcon: "ion-laptop",
    allowedRoles: ["admin"],
  },
  {
    key: "approvalProcess",
    label: "sidebar.approvalProcess",
    leftIcon: "ion-checkmark-round",
    allowedRoles: ["admin"],
  },

  {
    key: "holidays",
    label: "sidebar.holidays",
    leftIcon: "ion-plane",
    allowedRoles: ["admin"],
  },
  {
    key: "logs",
    label: "sidebar.logs",
    leftIcon: "ion-folder",
    allowedRoles: ["admin"],
  },
  {
    key: "news",
    label: "sidebar.news",
    leftIcon: "ion-ios-paper",
    allowedRoles: ["admin", "worker", "user", "worker-outsource"],
  },
  {
    key: "announcements",
    label: "sidebar.announcements",
    leftIcon: "ion-speakerphone",
    allowedRoles: ["admin", "worker", "user", "worker-outsource"],
  },
  {
    key: "polls",
    label: "sidebar.polls",
    leftIcon: "ion-stats-bars",
    allowedRoles: ["admin", "worker", "user", "worker-outsource"],
  },
];
export default options;
