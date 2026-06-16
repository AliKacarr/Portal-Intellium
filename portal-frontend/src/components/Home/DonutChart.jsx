import React from "react";
import GoogleChart from "react-google-charts";

const DonutChart = ({ ticketCounts }) => {

     const DonutChart = {
          title: "Ticket",
          key: "Ticket",
          chartType: "PieChart",
          data: [
               ["Biletler", "Bilet Grafiği"],
               ["Yeni Bilet", ticketCounts.newRequestCount],
               ["Devam Eden Bilet", ticketCounts.inProgressCount],
               ["Çözümlenen Bilet", ticketCounts.completedCount],
          ],
          options: {
               titleTextStyle: {
                    color: "#788195",
               },
               legend: {
                    textStyle: {
                         color: "#788195",
                    },
               },
               pieHole: 0.4,
               pieSliceTextStyle: {
                    color: "#ffffff",
               },
               is3D: true,
               colors: ["#42A5F6", "#7266BA", "#9BC000"],
               tooltip: {
                    textStyle: {
                         color: "#788195",
                    },
               },
          },
     };

     return (
          <div>
               {ticketCounts && (
                    <GoogleChart {...DonutChart} height={"350px"} />
               )}
          </div>
     );
};

export default DonutChart;
