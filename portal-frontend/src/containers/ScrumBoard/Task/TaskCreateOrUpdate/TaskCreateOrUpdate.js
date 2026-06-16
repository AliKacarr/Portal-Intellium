import React from 'react';
import { connect } from 'react-redux';
import { Formik } from 'formik';
import RenderTaskForm from './RenderCreateTaskForm/RenderCreateTaskForm';
import scrumBoardActions from '@iso/redux/scrumBoard/actions';
import { CreateTaskWrapper } from './TaskCreateOrUpdate.style';

const initialValues = {
  task: {},
  taskMembers: [],
  taskLabels: [],
  taskAttachments: [],
};

const TaskForm = props => {
  const initials = {
    ...initialValues,
    ...props.initials
  };


  return (
    <CreateTaskWrapper>
      <Formik initialValues={initials}>
        {formikProps => (
          <RenderTaskForm
            {...formikProps}
            columnId={props.columnId}
            onCancel={props.closeDrawer}
            onLocalSave={props.onLocalSave}
            hideDelete={props.hideDelete}
            disableDetailBack={props.disableDetailBack}
            setRefresh={3}
            onDelete={() => {
              props.deleteTask({
                taskId: props.initials.task.id,
                column_id: props.columnId,
              });
              props.closeDrawer();
            }}
            onEditCancel={() => {
              if (props.disableDetailBack) {
                props.closeDrawer();
                return;
              }

              props.cancelEditTask(props.initials);
              props.openDrawer({
                drawerType: 'CARD_DETAILS',
                drawerProps: {
                  task: { ...props.initials.task },
                  columnId: props.columnId,
                },
              });
            }}
          />
        )}
      </Formik>
    </CreateTaskWrapper>
  );
};
export default connect(
  null,
  {
    ...scrumBoardActions,
  }
)(TaskForm);
