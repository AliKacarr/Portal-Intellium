import styled from "styled-components";
import { palette } from "styled-theme";
import WithDirection from "@iso/lib/helpers/rtl";
import BoxComponent from "@iso/components/utility/box";

const ProjectPageWrapper = styled.div`
    .ProjectTableBtn {
        display: flex;
        justify-content: ${(props) =>
            props["data-rtl"] === "rtl" ? "flex-start" : "flex-end"};
        align-items: ${(props) =>
            props["data-rtl"] === "rtl" ? "flex-start" : "flex-end"};
        margin-top: 15px;

        .ProjectEditAddBtn {
            background: ${palette("blue", 14)};
            color: #fff;
        }
    }
`;
const BoxWrapper = styled(BoxComponent)`
    .isoProjectTableBtn {
        display: flex;
        margin-bottom: 30px;
        a {
            margin-left: auto;
        }
    }
`;

const CardWrapper = styled.div`
    width: auto;
    overflow: inherit;
    position: relative;
    .isoProjectTable {
        table {
            tbody {
                tr {
                    td {
                        .isoProjectBtnView {
                            display: flex;
                            flex-direction: row;
                            align-items: center; 
                            
                            /* TÜM İKONLAR ARASI BOŞLUK AYARI */
                            > a {
                                /* İkonlar arası boşluk 8px olarak ayarlandı */
                                margin: 0 8px 0 0; 
                                font-size: 18px; 
                                
                                /* RTL için ayrı bir ayar yapıyoruz */
                                margin-left: ${(props) =>
                                    props["data-rtl"] === "rtl" ? "8px" : "0"};
                                margin-right: ${(props) =>
                                    props["data-rtl"] === "rtl" ? "0" : "8px"};
                                
                                /* Son ikonda boşluk sıfırlanır */
                                &:last-child {
                                    margin-right: 0;
                                    margin-left: 0;
                                }
                            }

                            /* Kalem İkonu (Düzenle) - Siyah/Gri tonu */
                            .projectEditBtn { 
                                color: #666; /* Daha koyu gri/siyah ton */
                                &:hover {
                                    color: #333;
                                }
                            }
                            
                            /* Çöp Kutusu İkonu (Sil) - Kırmızı tonu */
                            .projectDltBtn {
                                color: ${palette("error", 0)}; /* Kırmızı tonu */
                                &:hover {
                                    color: ${palette("error", 2)};
                                }
                            }
                        }
                    }
                    &:hover {
                        .isoProjectBtnView {
                            ${"" /* opacity: 1; */};
                        }
                    }
                }
            }
        }
    }

    .projectListTable {
        .ant-dropdown-menu-item,
        .ant-dropdown-menu-submenu-title {
            &:hover {
                background-color: ${palette("secondary", 1)};
            }
        }

        .projectViewBtn {
            color: ${palette("text", 3)};

            &:hover {
                color: ${palette("primary", 0)};
            }
        }

        .projectDltBtn {
            font-size: 18px;
            border: 0;
            color: ${palette("error", 0)};

            &:hover {
                border: 0;
                color: ${palette("error", 2)};
            }
        }
    }
`;

const Box = WithDirection(BoxWrapper);
export { Box, ProjectPageWrapper };
export default WithDirection(CardWrapper);
export { CardWrapper };