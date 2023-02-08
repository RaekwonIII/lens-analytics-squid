import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export const barChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: "top" as const,
    },
    title: {
      display: false,
      text: "Daily Analytics",
    },
  },
};

const headers = {
  "content-type": "application/json",
};
const requestBody = {
  query: `query MyQuery {
    profilesConnection(orderBy: id_ASC) {
      totalCount
    }
    postsConnection(orderBy: id_ASC) {
      totalCount
    }
    commentsConnection(orderBy: id_ASC) {
      totalCount
    }
    getCommentDayData {
      count
      day
    }
    getPostDayData {
      count
      day
    }
    getProfilesDayData {
      count
      day
    }
  }
  `,
};
const graphQLOptions = {
  method: "POST",
  url: process.env.REACT_APP_SQUID_GRAPHQL || "http://localhost:4350/graphql",
  headers,
  data: requestBody,
};

type DataInterface = {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string;
  }[];
};

export function App() {
  const [barChartData, setBarChartData] = React.useState<DataInterface | null>(
    null
  );
  React.useEffect(() => {
    try {
      axios(graphQLOptions).then((response) => {
        let labelsSet: Set<string> = new Set([
          ...response.data.data.getProfilesDayData.map((obj: any) => obj.day),
          ...response.data.data.getPostDayData.map((obj: any) => obj.day),
          ...response.data.data.getCommentDayData.map((obj: any) => obj.day),
        ]);

        let profileDataMap: Map<string, number> = new Map<string, number>();
        let postDataMap: Map<string, number> = new Map<string, number>();
        let commentDataMap: Map<string, number> = new Map<string, number>();
        for (const date of labelsSet) {
          profileDataMap.set(
            date,
            response.data.data.getProfilesDayData.find(
              (obj: any) => obj.day === date
            )?.count || 0
          );
          postDataMap.set(
            date,
            response.data.data.getPostDayData.find(
              (obj: any) => obj.day === date
            )?.count || 0
          );
          commentDataMap.set(
            date,
            response.data.data.getCommentDayData.find(
              (obj: any) => obj.day === date
            )?.count || 0
          );
        }
        setBarChartData({
          labels: [...labelsSet].map((dateString) =>
            new Date(dateString).toLocaleDateString()
          ),
          datasets: [
            {
              label: "Daily Profiles created",
              data: [...profileDataMap.values()],
              backgroundColor: "rgba(255, 99, 132, 0.5)",
            },
            {
              label: "Daily Posts created",
              data: [...postDataMap.values()],
              backgroundColor: "rgba(53, 162, 235, 0.5)",
            },
            {
              label: "Daily Comments created",
              data: [...commentDataMap.values()],
              backgroundColor: "rgba(20, 255, 235, 0.5)",
            },
          ],
        });
      });
    } catch (err) {
      console.log("ERROR DURING AXIOS REQUEST", err);
    }
  }, []);

  if (!barChartData) return <div>
      <h1>"No data 🤷‍♂️!"</h1>
      <h2>Try to refresh the page in a short while</h2>
    </div>;
  const profileBarChartData = {
    labels: barChartData.labels,
    datasets: [barChartData.datasets[0]],
  };
  const postsBarChartData = {
    labels: barChartData.labels,
    datasets: [barChartData.datasets[1]],
  };
  const commentsBarChartData = {
    labels: barChartData.labels,
    datasets: [barChartData.datasets[2]],
  };
  return (
    <div>
      <h2>This page does not auto-refresh. Reload for new data</h2>
      <Bar options={barChartOptions} data={profileBarChartData} />
      <Bar options={barChartOptions} data={postsBarChartData} />
      <Bar options={barChartOptions} data={commentsBarChartData} />
      <Bar options={barChartOptions} data={barChartData} />
    </div>
  );
}
