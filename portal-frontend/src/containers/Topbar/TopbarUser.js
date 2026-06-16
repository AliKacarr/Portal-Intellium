import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Popover from "@iso/components/uielements/popover";
import IntlMessages from "@iso/components/utility/intlMessages";
import authAction from "@iso/redux/auth/actions";
import TopbarDropdownWrapper from "./TopbarDropdown.styles";
import Actions from "@iso/redux/themeSwitcher/actions";
import { Avatar } from "antd";
import { buildApiUrl } from "../../Api/host";
// Not: Topbar her sayfada render olduğu için burada gereksiz API çağrısı yapmak
// konsolda 401/403 gibi hatalara sebep olabiliyor. Avatar için mevcut state'teki imageUrl yeterli.

const { switchActivation } = Actions;
const { logout } = authAction;

export default function TopbarUser({ user }) {
  const [visible, setVisibility] = React.useState(false);
  const [currentUserImageUrl, setCurrentUserImageUrl] = useState(user?.imageUrl || null);
  const [imageRefreshKey, setImageRefreshKey] = useState(0);
  const dispatch = useDispatch();
  // accessToken burada kullanılmıyor; avatar için user.imageUrl yeterli.

  // Popover'ın görünürlük durumunu değiştiren fonksiyon
  function handleOpenChange(newOpen) {
    setVisibility(newOpen);
  }

  function getColorById(id) {
    // Renkler dizisi
    const customColors = [
      "#6895D2",
      "#A4CE95",
      "#D04848",
      "#F3B95F",
      "#FDE767",
    ];

    // ID'ye göre indeks hesaplanması
    const index = id % customColors.length;

    // ID'ye göre belirlenen renk döndürülmesi
    return customColors[index];
  }

  useEffect(() => {
    const handleUserImageUpdated = () => {
      setImageRefreshKey((prev) => prev + 1);
    };

    window.addEventListener("user-image-updated", handleUserImageUpdated);
    return () => {
      window.removeEventListener("user-image-updated", handleUserImageUpdated);
    };
  }, []);

  // Topbar seviyesinde user detayına tekrar GET atmayalım.
  // Redux/SecureLS zaten imageUrl'i güncelliyor; event ile de tetikleniyor.
  useEffect(() => {
    setCurrentUserImageUrl(user?.imageUrl || null);
  }, [user?.imageUrl, imageRefreshKey]);

  const resolveAvatarSrc = () => {
    const imageValue = currentUserImageUrl || user?.imageUrl;
    if (!imageValue) return null;

    if (imageValue.startsWith("data:image")) return imageValue;
    if (imageValue.startsWith("http://") || imageValue.startsWith("https://")) return imageValue;
    return buildApiUrl(imageValue);
  };

  const content = (
    <TopbarDropdownWrapper className="isoUserDropdown">
      <Link
        className="isoDropdownLink"
        to={"/dashboard/my-profile"}
        onClick={() => handleOpenChange(false)} // Popover'ı kapat
      >
        <IntlMessages id="topbar.myprofile" />
      </Link>

      <div
        className="isoDropdownLink"
        onClick={() => {
          dispatch(switchActivation());
          handleOpenChange(false); // Popover'ı kapat
        }}
      >
        <IntlMessages id="themeSwitcher.settings" />
      </div>
      {/* <a className="isoDropdownLink" href="# ">
        <IntlMessages id="sidebar.feedback" />
      </a>
      <a className="isoDropdownLink" href="# ">
        <IntlMessages id="topbar.help" />
      </a> */}
      <div className="isoDropdownLink" onClick={() => dispatch(logout())}>
        <IntlMessages id="topbar.logout" />
      </div>
    </TopbarDropdownWrapper>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      open={visible} // `visible` yerine `open` kullan
      onOpenChange={handleOpenChange} // `onVisibleChange` yerine `onOpenChange` kullan
      arrowPointAtCenter={true}
      placement="bottomLeft"
    >
      <div className="isoImgWrapper">
        {resolveAvatarSrc() ? (
          <Avatar src={resolveAvatarSrc()} />
        ) : (
          <Avatar
            style={{
              backgroundColor: getColorById(user?.id || 0),
            }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || "?"}
          </Avatar>
        )}
      </div>
    </Popover>
  );
}
