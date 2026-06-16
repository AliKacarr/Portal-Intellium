import React, { useState, useMemo, useCallback } from "react";
import { Button, Modal, DatePicker, InputNumber, Form, Input } from "antd";
import { Gantt, ViewMode } from "gantt-task-react";
import * as XLSX from "xlsx";
import moment from "moment";
import "gantt-task-react/dist/index.css";
import "./Gantt.css";

const { RangePicker } = DatePicker;

const GanttChart = () => {
  const initialTasks = useMemo(() => generateDemoTasks(), []);
  const [tasks, setTasks] = useState(initialTasks);
  const [viewMode, setViewMode] = useState(ViewMode.Day);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [form] = Form.useForm();

  function generateDemoTasks() {
    return [
      {
        id: "Project",
        name: "Ana Proje",
        start: moment().startOf("day").toDate(),
        end: moment().add(10, "days").endOf("day").toDate(),
        progress: 75,
        type: "project",
      },
      {
        id: "Task1",
        name: "Tasarım Aşaması",
        start: moment().add(1, "days").toDate(),
        end: moment().add(4, "days").toDate(),
        type: "task",
        dependencies: ["Project"],
        styles: { progressColor: "#ff54", progressSelectedColor: "#ff9e0d" },
        progress: 30,
      },
      {
        id: "Task2",
        name: "Geliştirme",
        start: moment().add(3, "days").toDate(),
        end: moment().add(8, "days").toDate(),
        type: "task",
        progress: 45,
        dependencies: ["Task1"],
      },
    ];
  }

  const handleExportExcel = useCallback(() => {
    const flattenTasks = (items) => {
      return items.reduce((acc, task) => {
        acc.push({
          "Görev Adı": task.name,
          "Başlangıç Tarihi": moment(task.start).format("DD.MM.YYYY"),
          "Bitiş Tarihi": moment(task.end).format("DD.MM.YYYY"),
          "İlerleme (%)": `${task.progress}%`,
          "Görev Türü": task.type === "task" ? "Görev" : "Proje",
          Bağımlılıklar: task.dependencies?.join(", ") || "Yok",
        });
        if (task.children) {
          acc.push(...flattenTasks(task.children));
        }
        return acc;
      }, []);
    };

    const ws = XLSX.utils.json_to_sheet(flattenTasks(tasks));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Gantt Verileri");
    XLSX.writeFile(wb, "gantt_verileri.xlsx");
  }, [tasks]);

  const handleAddTask = useCallback(() => {
    form.validateFields().then((values) => {
      const newTask = {
        id: `task_${Date.now()}`,
        name: values.name,
        start: values.dates[0].toDate(),
        end: values.dates[1].toDate(),
        progress: values.progress,
        type: "task",
        dependencies: [],
      };

      setTasks((prev) => [...prev, newTask]);
      setIsModalVisible(false);
      form.resetFields();
    });
  }, [form]);

  return (
    <div className="gantt-container">
      <div className="gantt-controls">
        <Button.Group>
          <Button onClick={() => setViewMode(ViewMode.Day)}>Gün</Button>
          <Button onClick={() => setViewMode(ViewMode.Week)}>Hafta</Button>
          <Button onClick={() => setViewMode(ViewMode.Month)}>Ay</Button>
        </Button.Group>

        <Button type="primary" onClick={() => setIsModalVisible(true)}>
          Yeni Görev Ekle
        </Button>

        <Button type="default" onClick={handleExportExcel}>
          Excel'e Aktar
        </Button>
      </div>

      <Gantt
        tasks={tasks}
        viewMode={viewMode}
        onSelect={setSelectedTask}
        listCellWidth={""}
        columnWidth={65}
        rowHeight={40}
        ganttHeight={600}
        barCornerRadius={4}
        barProgressColor="#1890ff"
        todayColor="rgba(255,0,0,0.1)"
      />

      <Modal
        title="Yeni Görev Ekle"
        open={isModalVisible}
        onOk={handleAddTask}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Görev Adı" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item
            name="dates"
            label="Tarih Aralığı"
            rules={[{ required: true }]}
          >
            <RangePicker
              showTime={{ format: "HH:mm" }}
              format="DD.MM.YYYY HH:mm"
            />
          </Form.Item>

          <Form.Item name="progress" label="İlerleme (%)" initialValue={0}>
            <InputNumber min={0} max={100} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GanttChart;
