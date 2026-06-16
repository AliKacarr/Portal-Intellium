import React, { lazy, Suspense, useEffect } from "react";
import { Route, useRouteMatch, Switch, Redirect, useHistory } from "react-router-dom"; // ✅ useHistory eklendi
import Loader from "@iso/components/utility/loader";
import { useSelector, useDispatch } from "react-redux"; // ✅ useDispatch eklendi
import SecureLS from "secure-ls";
import { resolveUiRole } from "@iso/lib/helpers/jwtRoles";

// ✅ YENİ İMPORTLAR (Adım 9 - Routing Mantığı)
// Import yolunu projene göre düzenle. Genelde @iso/redux/... veya ../redux/... şeklindedir.
import { selectCurrentRoute, resetCurrentRoute } from "@iso/redux/dashboard/dashboardSlice"; 

// --- MEVCUT SAYFALAR ---
const EditHealthInfo = lazy(() => import("@iso/containers/HealthInfo-Admin/EditHealthInfo"));
const HealthInfoDetails = lazy(() => import("@iso/containers/HealthInfo-Admin/HealthInfoDetails"));

// --- İZİN YÖNETİMİ ---
const MyPermissionRequests = lazy(() => import("@iso/containers/Permission/MyRequests"));

// --- ZİMMET & ENVANTER YÖNETİMİ (YENİLER) ---
const MyAssetRequests = lazy(() => import("@iso/containers/ZimmetBilgilerim/MyRequests")); 
const IncomingAssetRequests = lazy(() => import("@iso/containers/ZimmetBilgileri/IncomingRequests")); 
const Products = lazy(() => import("@iso/containers/Products/Products")); 

const ls = new SecureLS({ encodingType: "aes" });

const routes = [
  {
    path: "",
    component: lazy(() => import("@iso/containers/Home/Home")),
    exact: true,
    allowedRoles: ["admin", "worker", "user", "worker-outsource"],
  },
  {
    path: "scrum-board",
    component: lazy(() => import("@iso/containers/ScrumBoard")),
    exact: false, 
    allowedRoles: ["admin", "worker", "user"],
  },
  {
    path: "my-profile",
    component: lazy(() => import("@iso/containers/Profile/Profile")),
    allowedRoles: ["admin", "worker"],
  },
  {
    path: "my-profile-user",
    component: lazy(() => import("@iso/containers/Profile/ProfileUser")),
    allowedRoles: ["user", "worker-outsource"],
  },
  {
    path: "logs",
    component: lazy(() => import("@iso/containers/Log/Logs")),
    exact: true,
    allowedRoles: ["admin"],
  },
  {
    path: "holidays",
    component: lazy(() => import("@iso/containers/Holidays/holidays")),
    allowedRoles: ["admin", "worker", "user"],
  },
  {
    path: "healthInfo",
    component: lazy(() => import("@iso/containers/HealthInfo/HealthInfo")),
    exact: true,
    allowedRoles: ["admin", "worker", "worker-outsource"],
  },
  {
    path: "healthInfo/details/:id",
    component: lazy(() =>
      import("@iso/containers/HealthInfo/HealthInfoDetails")
    ),
    allowedRoles: ["admin", "worker", "worker-outsource"],
  },
  {
    path: "admin-healthInfo", 
    component: lazy(() =>
      import("@iso/containers/HealthInfo-Admin/HealthInfo-Admin")
    ),
    exact: true, 
    allowedRoles: ["admin"],
  },
  {
    path: "admin-healthInfo/add", 
    component: lazy(() =>
      import("@iso/containers/HealthInfo-Admin/AddHealthInfo")
    ),
    exact: true, 
    allowedRoles: ["admin"],
  },
  {
    path: "admin-healthInfo/edit/:id", 
    component: EditHealthInfo,
    allowedRoles: ["admin"],
  },
  {
    path: "admin-healthInfo/details/:id", 
    component: HealthInfoDetails,        
    allowedRoles: ["admin"],              
  },
  {
    path: "UserList",
    component: lazy(() => import("@iso/containers/User/UserList")),
    allowedRoles: ["admin"],
  },
  {
    path: "CreateUser",
    component: lazy(() => import("@iso/containers/User/CreateUser/createUser")),
    allowedRoles: ["admin"],
  },
  {
    path: "createCustomer",
    component: lazy(() =>
      import("@iso/containers/Customer/CreateCustomer/CreateCustomer")
    ),
    allowedRoles: ["admin"],
  },
  {
    path: "customerList",
    component: lazy(() =>
      import("@iso/containers/Customer/CustomersList/CustomersList")
    ),
    allowedRoles: ["admin"],
  },
  {
    path: "customer/:id",
    component: lazy(() =>
      import("@iso/containers/Customer/CustomerDetails/CustomerDetails")
    ),
    allowedRoles: ["admin"],
  },
  {
    path: "editCustomer/:id",
    component: lazy(() =>
      import("@iso/containers/Customer/EditCustomer/EditCustomer")
    ),
    allowedRoles: ["admin"],
  },
  // --- BURASI KRİTİK: Notification'dan 'projectList' gelince buraya eşleşecek ---
  {
    path: "projectList",
    component: lazy(() => import("@iso/containers/Project/projectList")),
    allowedRoles: ["admin", "worker", "user"],
  },
  {
    path: "projectDetail/:id",
    component: lazy(() => import("@iso/containers/Project/projectDetail")),
    allowedRoles: ["admin", "worker", "user"],
  },
  {
    path: "projectTeamList",
    component: lazy(() =>
      import("@iso/containers/ProjectTeam/ProjectTeamList")
    ),
    allowedRoles: ["admin", "worker", "user"],
  },
  {
    path: "projectTeamDetail/:id",
    component: lazy(() =>
      import("@iso/containers/ProjectTeam/ProjectTeamDetail")
    ),
    allowedRoles: ["admin", "worker", "user"],
  },
  
  // --- İZİN YÖNETİMİ ---
  {
    path: "permission",
    component: lazy(() => import("@iso/containers/Permission/Permission")),
    allowedRoles: ["admin", "worker", "worker-outsource"],
  },
  {
    path: "my-requests", 
    component: MyPermissionRequests,
    allowedRoles: ["admin", "worker", "worker-outsource"], 
  },
  {
    path: "approvalProcess",
    component: lazy(() =>
      import("@iso/containers/ConfirmationForm/Confirmation")
    ),
    allowedRoles: ["admin", "worker"],
  },

  // --- ENVANTER & ZİMMET YÖNETİMİ ---
  {
    path: "products", 
    component: Products,
    allowedRoles: ["admin", "worker"], 
  },
  {
    path: "my-assets",
    component: lazy(() => import("@iso/containers/ZimmetBilgilerim/Assets")),
    allowedRoles: ["admin", "worker", "worker-outsource"],
  },
  {
    path: "my-assets-requests", 
    component: MyAssetRequests,
    allowedRoles: ["admin", "worker"], 
  },
  {
    path: "assets",
    component: lazy(() => import("@iso/containers/ZimmetBilgileri/Assets")),
    allowedRoles: ["admin", "worker"],
  },
  {
    path: "incoming-requests", 
    component: IncomingAssetRequests,
    allowedRoles: ["admin"], 
  },
  // ---------------------------------------------

  {
    path: "tickets",
    component: lazy(() => import("@iso/containers/Tickets/TicketList")),
    allowedRoles: ["admin", "worker", "user"],
  },
  {
    path: "notes",
    component: lazy(() => import("@iso/containers/Notes/Notes")),
    allowedRoles: ["admin", "worker", "user", "worker-outsource"],
  },
  {
    path: "addticket",
    component: lazy(() => import("@iso/containers/Tickets/AddTicket")),
    allowedRoles: ["admin", "worker", "user"],
  },
  {
    path: "ticketDetail/:id",
    component: lazy(() => import("@iso/containers/Tickets/TicketDetail")),
    allowedRoles: ["admin", "worker", "user"],
  },
  {
    path: "emergency-contact",
    component: lazy(() =>
      import("@iso/containers/EmergencyContact/EmergencyContact")
    ),
    allowedRoles: ["admin", "worker"],
  },
  {
    path: ["folder/:Id", "documents"],
    component: lazy(() => import("@iso/containers/Documents/Documents")),
    allowedRoles: ["admin", "worker", "worker-outsource"],
  },
  {
    path: "editUser/:id",
    component: lazy(() => import("@iso/containers/User/editUser")),
    allowedRoles: ["admin"],
  },
  {
    path: "my-expenses/new",
    component: lazy(() => import("@iso/containers/Expense/ExpenseCreatePage")),
    allowedRoles: ["admin", "worker", "worker-outsource"],
  },
  // --- TALEP YÖNETİMİ ---
  {
    path: "requests/admin",
    component: lazy(() => import("@iso/containers/Request/AdminRequests")),
    exact: true,
    allowedRoles: ["admin"],
  },
  {
    path: "requests/edit/:id",
    component: lazy(() => import("@iso/containers/Request/CreateRequest")),
    allowedRoles: ["admin", "worker", "worker-outsource"],
  },
  {
    path: "requests/new",
    component: lazy(() => import("@iso/containers/Request/CreateRequest")),
    allowedRoles: ["admin", "worker", "worker-outsource"],
  },
  {
    path: "requests/:id",
    component: lazy(() => import("@iso/containers/Request/RequestDetail")),
    allowedRoles: ["admin", "worker", "worker-outsource"],
  },
  {
    path: "requests",
    component: lazy(() => import("@iso/containers/Request/MyRequests")),
    exact: true,
    allowedRoles: ["admin", "worker", "worker-outsource"],
  },
  {
    path: "my-expenses",
    component: lazy(() => import("@iso/containers/Expense/Expense")),
    allowedRoles: ["admin", "worker", "worker-outsource"],
  },
  {
    path: "notification",
    component: lazy(() => import("@iso/containers/Notification/Notification")),
    allowedRoles: ["admin", "worker", "user"],
  },
  {
    path: "parameter",
    component: lazy(() => import("@iso/containers/Parametre/Parametre")),
    allowedRoles: ["admin"],
  },
  {
    path: "gantt",
    component: lazy(() => import("@iso/containers/Gantt/Gantt")),
    allowedRoles: ["admin"],
  },
  {
    path: "news",
    component: lazy(() => import("@iso/containers/News/NewsList")),
    exact: true,
    allowedRoles: ["admin", "worker", "user", "worker-outsource"],
  },
  {
    path: "news/:id",
    component: lazy(() => import("@iso/containers/News/NewsDetail")),
    allowedRoles: ["admin", "worker", "user", "worker-outsource"],
  },
  {
    path: "announcements",
    component: lazy(() => import("@iso/containers/Announcements/AnnouncementList")),
    exact: true,
    allowedRoles: ["admin", "worker", "user", "worker-outsource"],
  },
  {
    path: "announcements/:id",
    component: lazy(() => import("@iso/containers/Announcements/AnnouncementDetail")),
    allowedRoles: ["admin", "worker", "user", "worker-outsource"],
  },
  {
    path: "polls",
    component: lazy(() => import("@iso/containers/Polls/PollList")),
    exact: true,
    allowedRoles: ["admin", "worker", "user", "worker-outsource"],
  },
  {
    path: "polls/:id",
    component: lazy(() => import("@iso/containers/Polls/PollDetail")),
    allowedRoles: ["admin", "worker", "user", "worker-outsource"],
  },
];

export default function AppRouter() {
  const { url } = useRouteMatch();
  const dispatch = useDispatch(); // ✅
  const history = useHistory();   // ✅
  const reduxRole = useSelector((state) => {
    const r = state?.Auth?.role;
    if (!r) return null;
    if (typeof r === "string") return r;
    return r?.roleName ?? r?.RoleName ?? r?.name ?? r?.Name ?? null;
  });
  const accessToken = useSelector((state) => state?.Auth?.accessToken) || ls.get("accessToken");
  const userRole = resolveUiRole({ reduxRole, accessToken });
  
  // ✅ ADIM 9: Redux'tan gelen rota değişikliğini dinle
  const currentRoute = useSelector(selectCurrentRoute);

  useEffect(() => {
    // Eğer Redux'ta bir rota tanımlıysa (örn: 'projectList')
    if (currentRoute) {
      // O sayfaya yönlendir
      history.push(`${url}/${currentRoute}`);
      
      // Ve Redux'taki rotayı temizle ki sürekli yönlendirme yapmasın
      dispatch(resetCurrentRoute());
    }
  }, [currentRoute, history, url, dispatch]);
  // -----------------------------------------------------

  return (
    <Suspense fallback={<Loader />}>
      <Switch>
        {routes.map((route, idx) => {
          const allowedRoles = route.allowedRoles || [];
          
          if (!userRole || !allowedRoles.includes(userRole)) {
            return null; 
          }

          const pathProp = Array.isArray(route.path)
            ? route.path.map((p) => `${url}/${p}`)
            : `${url}/${route.path}`;

          return (
            <Route exact={route.exact} key={idx} path={pathProp}>
              <route.component />
            </Route>
          );
        })}
        <Route exact path={`${url}/leaveBalanceAdmin`}>
          <Redirect to={`${url}/approvalProcess`} />
        </Route>
        <Redirect to={userRole ? `${url}` : '/signin'} />
      </Switch>
    </Suspense>
  );
}