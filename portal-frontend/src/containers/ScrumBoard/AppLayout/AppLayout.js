import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { connect, useDispatch, useSelector } from 'react-redux';
import { selectDeepLink, clearDeepLink } from '../../../redux/deepLink/deepLinkSlice';
import { CaretDownOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import {
  Layout,
  Button,
  Popover,
  Checkbox,
  Modal,
  Space,
  Typography,
  Badge,
  Card,
  Empty,
  Tag,
  Collapse,
  Select,
  message,
} from 'antd';
import SearchInput from '@iso/components/ScrumBoard/SearchInput/SearchInput';
import { Scrollbars } from 'react-custom-scrollbars';
import modalActions from '@iso/redux/modal/actions';
import scrumBoardActions from '@iso/redux/scrumBoard/actions';
import drawerActions from '@iso/redux/drawer/actions';
import { Title, Filters, Header, HeaderSecondary } from './AppLayout.style';
import {
  approveAiTaskPreviews,
  getAiTaskPreviewsMine,
  getAllBoards,
  getBoardCategories,
  getTaskListWithTasks,
  rejectAiTaskPreviews,
  updateAiTaskPreview,
} from '../../../Api/ScrumBoardApi';

const { Content } = Layout;
const { Text } = Typography;
const { Panel } = Collapse;
const AUTO_LIST_APPROVE_SUCCESS_KEY = 'autoListApproveSuccess';

const syncMeetingCounts = meetings =>
  meetings.map(meeting => {
    const boards = meeting.boards.map(board => {
      const columns = board.columns.map(column => ({
        ...column,
        count: column.cards.length,
      }));

      return {
        ...board,
        columns,
        cardCount: columns.reduce((sum, column) => sum + column.cards.length, 0),
      };
    });

    return {
      ...meeting,
      boards,
      boardCount: boards.length,
      cardCount: boards.reduce((sum, board) => sum + board.cardCount, 0),
    };
  });

const formatDate = (value, locale) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString(locale === 'tr-TR' ? 'tr-TR' : 'en-US');
};

const groupPreviewsAsMeetings = (previews, defaultMeetingName) => {
  const meetingsMap = new Map();

  previews.forEach(preview => {
    const meetingKey = preview.sourceReference || `preview-${preview.id}`;

    if (!meetingsMap.has(meetingKey)) {
        meetingsMap.set(meetingKey, {
          id: String(meetingKey),
          createdAt: preview.createdAt,
          meetingName: preview.sourceReference || defaultMeetingName,
          boards: [],
      });
    }

    const meeting = meetingsMap.get(meetingKey);
    let board = meeting.boards.find(item => item.id === preview.boardId);

    if (!board) {
      board = {
        id: preview.boardId,
        name: preview.boardName,
        columns: [],
      };
      meeting.boards.push(board);
    }

    let column = board.columns.find(item => item.id === preview.taskListId);

    if (!column) {
      column = {
        id: preview.taskListId,
        title: preview.taskListName,
        cards: [],
      };
      board.columns.push(column);
    }

    column.cards.push({
      id: preview.id,
      previewId: preview.id,
      title: preview.title,
      description: preview.description,
      dueDate: preview.dueDate,
      listName: preview.taskListName,
      boardName: preview.boardName,
      boardId: preview.boardId,
      taskListId: preview.taskListId,
    });
  });

  return syncMeetingCounts(Array.from(meetingsMap.values()));
};

const AppLayout = ({
  children,
  setFilterBoardSearchText,
  history,
  openDrawer,
}) => {
  const intl = useIntl();
  const [autoLists, setAutoLists] = useState([]);
  const [categories, setCategories] = useState({ data: [] });
  const [boardCatalog, setBoardCatalog] = useState([]);
  const [isAutoListModalOpen, setIsAutoListModalOpen] = useState(false);
  const [expandedMeetingKeys, setExpandedMeetingKeys] = useState([]);
  const [approvedMeetingIds, setApprovedMeetingIds] = useState([]);
  const [approvedBoardKeys, setApprovedBoardKeys] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [pendingBoardChange, setPendingBoardChange] = useState(null);
  const dispatch = useDispatch();
  const deepLink = useSelector(selectDeepLink);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (deepLink?.route === 'scrum-board' && deepLink?.deepLinkId && String(deepLink.deepLinkId).startsWith('autolist')) {
      const parts = String(deepLink.deepLinkId).split('-');
      // For instance 'autolist-1234' -> '1234'
      const targetMeetingId = parts.length > 1 ? parts.slice(1).join('-') : null;
      
      dispatch(clearDeepLink());
      handleOpenAutoListModal(targetMeetingId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLink, dispatch]);

  const selectedPreviewIds = useMemo(() => {
    const ids = new Set();

    autoLists.forEach(meeting => {
      const meetingSelected = approvedMeetingIds.includes(String(meeting.id));

      meeting.boards.forEach(board => {
        const boardSelected = approvedBoardKeys.includes(
          `${meeting.id}:${board.id}`
        );
        if (!meetingSelected && !boardSelected) {
          return;
        }

        board.columns.forEach(column => {
          column.cards.forEach(card => ids.add(card.previewId));
        });
      });
    });

    return Array.from(ids);
  }, [approvedBoardKeys, approvedMeetingIds, autoLists]);

  const loadBoardCatalog = async () => {
    try {
      const boardResponse = await getAllBoards();
      const boards = boardResponse?.data?.data || [];

      const boardResults = await Promise.all(
        boards.map(async board => {
          try {
            const taskListResponse = await getTaskListWithTasks(board.id);
            const taskLists = taskListResponse?.data?.data || [];

            return {
              id: board.id,
              name: board.name,
              taskLists: taskLists.map(taskList => ({
                id: taskList.id,
                name: taskList.name,
              })),
            };
          } catch (error) {
            return {
              id: board.id,
              name: board.name,
              taskLists: [],
            };
          }
        })
      );

      if (isMountedRef.current) {
        setBoardCatalog(boardResults);
      }
    } catch (error) {
      if (isMountedRef.current) {
        message.error(intl.formatMessage({ id: 'scrumboard.app.errorBoardList' }));
      }
    }
  };

  const loadPreviews = async () => {
    try {
      if (isMountedRef.current) {
        setPreviewLoading(true);
      }
      const response = await getAiTaskPreviewsMine();
      const previews = response?.data?.data || [];
      if (isMountedRef.current) {
        setAutoLists(
          groupPreviewsAsMeetings(
            previews,
            intl.formatMessage({ id: 'scrumboard.ai.defaultMeetingName' })
          )
        );
      }
    } catch (error) {
      if (isMountedRef.current) {
        message.error(intl.formatMessage({ id: 'scrumboard.app.errorAiPreviews' }));
      }
    } finally {
      if (isMountedRef.current) {
        setPreviewLoading(false);
      }
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem(AUTO_LIST_APPROVE_SUCCESS_KEY) === 'true') {
      sessionStorage.removeItem(AUTO_LIST_APPROVE_SUCCESS_KEY);
      message.success(intl.formatMessage({ id: 'scrumboard.app.successCardsAdded' }));
    }

    getBoardCategories()
      .then(response => {
        if (isMountedRef.current) {
          setCategories({ data: response.data.data });
        }
      })
      .catch(() => {
        if (isMountedRef.current) {
          message.error(intl.formatMessage({ id: 'scrumboard.app.errorCategories' }));
        }
      });

    loadBoardCatalog();
    loadPreviews();
  }, []);

  const handleNew = () => {
    dispatch(scrumBoardActions.newBoard());
    history.push('/dashboard/scrum-board/new');
  };

  const handleOpenAutoListModal = async (targetMeetingId = null) => {
    setExpandedMeetingKeys(targetMeetingId && typeof targetMeetingId === 'string' ? [targetMeetingId] : []);
    setApprovedMeetingIds([]);
    setApprovedBoardKeys([]);
    setIsAutoListModalOpen(true);
    await loadPreviews();
  };

  const handleMeetingApprovalChange = (meetingId, checked) => {
    const meeting = autoLists.find(item => String(item.id) === String(meetingId));
    const meetingBoardKeys =
      meeting?.boards?.map(board => `${meetingId}:${board.id}`) || [];

    setApprovedMeetingIds(prev =>
      checked
        ? Array.from(new Set([...prev, String(meetingId)]))
        : prev.filter(id => id !== String(meetingId))
    );

    setApprovedBoardKeys(prev =>
      checked
        ? Array.from(new Set([...prev, ...meetingBoardKeys]))
        : prev.filter(key => !meetingBoardKeys.includes(key))
    );
  };

  const handleBoardApprovalChange = (meetingId, boardId, checked) => {
    const boardKey = `${meetingId}:${boardId}`;
    const meeting = autoLists.find(item => String(item.id) === String(meetingId));
    const meetingBoardKeys =
      meeting?.boards?.map(board => `${meetingId}:${board.id}`) || [];

    setApprovedBoardKeys(prev => {
      const nextBoardKeys = checked
        ? Array.from(new Set([...prev, boardKey]))
        : prev.filter(key => key !== boardKey);

      const allMeetingBoardsSelected =
        meetingBoardKeys.length > 0 &&
        meetingBoardKeys.every(key => nextBoardKeys.includes(key));

      setApprovedMeetingIds(currentMeetingIds =>
        allMeetingBoardsSelected
          ? Array.from(new Set([...currentMeetingIds, String(meetingId)]))
          : currentMeetingIds.filter(id => id !== String(meetingId))
      );

      return nextBoardKeys;
    });
  };

  const getBoardOptions = () =>
    boardCatalog.map(board => ({
      label: board.name,
      value: board.id,
    }));

  const getListOptions = boardId => {
    const board = boardCatalog.find(item => item.id === boardId);
    if (!board) {
      return [];
    }

    return board.taskLists.map(taskList => ({
      label: taskList.name,
      value: taskList.id,
    }));
  };

  const savePreviewUpdate = async ({ id, taskListId, title, description, dueDate }) => {
    try {
      setActionLoading(true);
      await updateAiTaskPreview({
        id,
        taskListId,
        title,
        description,
        dueDate,
      });
      await loadPreviews();
      message.success(intl.formatMessage({ id: 'scrumboard.app.successPreviewUpdated' }));
    } catch (error) {
      message.error(intl.formatMessage({ id: 'scrumboard.app.errorPreviewUpdate' }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedPreviewIds.length === 0) {
      return;
    }

    try {
      setActionLoading(true);
      await rejectAiTaskPreviews({ previewIds: selectedPreviewIds });
      await loadPreviews();
      setExpandedMeetingKeys([]);
      setApprovedMeetingIds([]);
      setApprovedBoardKeys([]);
      message.success(intl.formatMessage({ id: 'scrumboard.app.successDeletedSelected' }));
    } catch (error) {
      message.error(intl.formatMessage({ id: 'scrumboard.app.errorDeleteSelected' }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteCard = async previewId => {
    try {
      setActionLoading(true);
      await rejectAiTaskPreviews({ previewIds: [previewId] });
      await loadPreviews();
      message.success(intl.formatMessage({ id: 'scrumboard.app.successPreviewDeleted' }));
    } catch (error) {
      message.error(intl.formatMessage({ id: 'scrumboard.app.errorPreviewDelete' }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (selectedPreviewIds.length === 0) {
      message.warning(intl.formatMessage({ id: 'scrumboard.app.warnSelectMeeting' }));
      return;
    }

    try {
      setActionLoading(true);
      await approveAiTaskPreviews({ previewIds: selectedPreviewIds });
      setApprovedMeetingIds([]);
      setApprovedBoardKeys([]);
      sessionStorage.setItem(AUTO_LIST_APPROVE_SUCCESS_KEY, 'true');
      setIsAutoListModalOpen(false);
      window.location.reload();
    } catch (error) {
      message.error(intl.formatMessage({ id: 'scrumboard.app.errorApprove' }));
    } finally {
      setActionLoading(false);
    }
  };

  const handleCardBoardChange = (card, targetBoardId) => {
    const targetBoard = boardCatalog.find(board => board.id === targetBoardId);

    if (!targetBoard || !targetBoard?.taskLists?.length) {
      message.warning(intl.formatMessage({ id: 'scrumboard.app.warnNoList' }));
      return;
    }

    setPendingBoardChange({ card, targetBoard });
  };

  const handleCardListChange = async (card, taskListId) => {
    await savePreviewUpdate({
      id: card.previewId,
      taskListId,
      title: card.title,
      description: card.description,
      dueDate: card.dueDate,
    });
  };

  const handleOpenCardEditDrawer = card => {
    const taskInitials = {
      editing: true,
      task: {
        id: card.previewId,
        name: card.title,
        description: card.description,
        createdDate: card.startDate || card.dueDate || new Date().toISOString(),
        dueDate: card.dueDate || new Date().toISOString(),
        taskListId: card.taskListId,
        orderNo: 0,
      },
      taskMembers: [],
      taskLabels: [],
      taskAttachments: [],
    };

    const onLocalSave = updatedTask => {
      savePreviewUpdate({
        id: card.previewId,
        taskListId: updatedTask.taskListId,
        title: updatedTask.name,
        description: updatedTask.description,
        dueDate: updatedTask.dueDate,
      });
    };

    openDrawer({
      drawerType: 'CREATE_OR_EDIT_TASK',
      drawerProps: {
        initials: taskInitials,
        columnId: card.taskListId,
        onLocalSave,
        hideDelete: true,
        disableDetailBack: true,
      },
    });
  };

  return (
    <Layout style={{ backgroundColor: '#fff', minHeight: '100vh' }}>
      <Header>
        <Title>{intl.formatMessage({ id: 'scrumboard.app.title' })}</Title>

        <Space size={12}>
          <Badge count={autoLists.length} size="small" offset={[-6, 6]}>
            <Button onClick={handleOpenAutoListModal}>
              {intl.formatMessage({ id: 'scrumboard.app.autoGenerated' })}
            </Button>
          </Badge>
          <Button type="primary" onClick={handleNew}>
            {intl.formatMessage({ id: 'scrumboard.app.newBoard' })}
          </Button>
        </Space>
      </Header>

      <HeaderSecondary>
        <SearchInput onChange={value => setFilterBoardSearchText(value)} />

        <Filters style={{ marginRight: '50px' }}>
          <Popover
            placement="bottom"
            content={
              <Checkbox.Group
                options={categories.data.map(category => ({
                  label: category.name,
                  value: category.id,
                }))}
                onChange={value =>
                  dispatch(scrumBoardActions.setFilterBoardCategory(value))
                }
              />
            }
            trigger="click"
          >
            <span>
              {intl.formatMessage({ id: 'scrumboard.app.categories' })}
              <CaretDownOutlined style={{ marginLeft: '5px' }} />
            </span>
          </Popover>
        </Filters>
      </HeaderSecondary>

      <Content
        style={{
          padding: '0 24px',
        }}
      >
        <Scrollbars style={{ width: '100%', height: 'calc(100vh - 200px)' }}>
          {children}
        </Scrollbars>
      </Content>

      <Modal
        title={intl.formatMessage({ id: 'scrumboard.app.autoModalTitle' })}
        open={isAutoListModalOpen}
        onCancel={() => setIsAutoListModalOpen(false)}
        width={1200}
        confirmLoading={actionLoading}
        footer={[
          <Button
            key="delete-selected"
            danger
            onClick={handleDeleteSelected}
            disabled={selectedPreviewIds.length === 0 || actionLoading}
          >
            {intl.formatMessage({ id: 'scrumboard.app.deleteSelected' })}
          </Button>,
          <Button
            key="approve"
            type="primary"
            onClick={handleApprove}
            loading={actionLoading}
            disabled={autoLists.length === 0}
          >
            {intl.formatMessage({ id: 'scrumboard.app.approveSend' })}
          </Button>,
        ]}
      >
        {autoLists.length > 0 ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card
              style={{ borderRadius: 16, backgroundColor: '#fafcff' }}
              bodyStyle={{ padding: 16 }}
            >
              <Space direction="vertical" size={4}>
                <Text strong>{intl.formatMessage({ id: 'scrumboard.app.aiCardTitle' })}</Text>
                <Text type="secondary">{intl.formatMessage({ id: 'scrumboard.app.aiCardIntro' })}</Text>
              </Space>
            </Card>

            <Collapse
              activeKey={expandedMeetingKeys}
              onChange={key =>
                setExpandedMeetingKeys(
                  Array.isArray(key) ? key.map(String) : key ? [String(key)] : []
                )
              }
            >
              {autoLists.map(list => (
                <Panel
                  key={String(list.id)}
                  header={
                    <Space
                      style={{
                        width: '100%',
                        justifyContent: 'space-between',
                        paddingRight: 16,
                      }}
                    >
                      <Space align="center" size={12}>
                        <Checkbox
                          checked={approvedMeetingIds.includes(String(list.id))}
                          onClick={event => event.stopPropagation()}
                          onChange={event =>
                            handleMeetingApprovalChange(list.id, event.target.checked)
                          }
                        />
                        <Text strong>{list.meetingName}</Text>
                        <Text strong style={{ color: '#1677ff' }}>
                          ({list.cardCount})
                        </Text>
                      </Space>
                      <Space size={8}>
                        <Tag color="default">
                          {intl.formatMessage({ id: 'scrumboard.app.boardTag' }, { count: list.boardCount })}
                        </Tag>
                        <Tag color="default">
                          {intl.formatMessage({ id: 'scrumboard.app.cardTag' }, { count: list.cardCount })}
                        </Tag>
                      </Space>
                    </Space>
                  }
                >
                  {list.boards?.length ? (
                    <div
                      style={{
                        background: '#fafbff',
                        border: '1px solid #eef1f7',
                        borderRadius: 18,
                        padding: 20,
                      }}
                    >
                      <Space direction="vertical" size={16} style={{ width: '100%' }}>
                        <Space
                          style={{
                            width: '100%',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Text type="secondary" style={{ paddingRight: 16 }}>
                            {intl.formatMessage({ id: 'scrumboard.app.meetingHint' })}
                          </Text>
                          <span style={{ whiteSpace: 'nowrap', color: '#64748b', fontSize: 13 }}>
                            {intl.formatMessage({ id: 'scrumboard.app.sentAt' })}{' '}
                            <strong>{formatDate(list.createdAt, intl.locale)}</strong>
                          </span>
                        </Space>

                        <Space direction="vertical" size={20} style={{ width: '100%' }}>
                          {list.boards.map(board => (
                            <Collapse
                              key={board.id}
                              style={{
                                background: '#ffffff',
                                border: '1px solid #eef1f7',
                                borderRadius: 16,
                                overflow: 'hidden',
                              }}
                            >
                              <Panel
                                key={board.id}
                                header={
                                  <Space
                                    style={{
                                      width: '100%',
                                      justifyContent: 'space-between',
                                      paddingRight: 16,
                                    }}
                                  >
                                    <Space>
                                      <Checkbox
                                        checked={approvedBoardKeys.includes(
                                          `${list.id}:${board.id}`
                                        )}
                                        onClick={event => event.stopPropagation()}
                                        onChange={event =>
                                          handleBoardApprovalChange(
                                            list.id,
                                            board.id,
                                            event.target.checked
                                          )
                                        }
                                      />
                                      <Text strong>{board.name}</Text>
                                    </Space>
                                    <Tag color="blue">
                                      {intl.formatMessage({ id: 'scrumboard.app.cardTag' }, { count: board.cardCount })}
                                    </Tag>
                                  </Space>
                                }
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    gap: 16,
                                    alignItems: 'flex-start',
                                    overflowX: 'auto',
                                    paddingBottom: 8,
                                  }}
                                >
                                  {board.columns
                                    .filter(column => column.cards.length > 0)
                                    .map(column => (
                                      <div
                                        key={column.id}
                                        style={{
                                          minWidth: 320,
                                          maxWidth: 320,
                                          flex: '0 0 320px',
                                        }}
                                      >
                                        <Space
                                          style={{
                                            width: '100%',
                                            justifyContent: 'space-between',
                                            marginBottom: 12,
                                          }}
                                        >
                                          <Text
                                            strong
                                            style={{
                                              textTransform: 'uppercase',
                                              fontSize: 13,
                                              color: '#7a8091',
                                            }}
                                          >
                                            {column.title}
                                          </Text>
                                          <Tag style={{ marginInlineEnd: 0 }}>
                                            {column.count}
                                          </Tag>
                                        </Space>

                                        <Space
                                          direction="vertical"
                                          size={12}
                                          style={{ width: '100%' }}
                                        >
                                          {column.cards.map(card => (
                                            <Card
                                              key={card.id}
                                              style={{
                                                borderRadius: 16,
                                                boxShadow:
                                                  '0 6px 18px rgba(15, 23, 42, 0.05)',
                                              }}
                                              bodyStyle={{ padding: 16 }}
                                            >
                                              <Space
                                                direction="vertical"
                                                size={12}
                                                style={{ width: '100%' }}
                                              >
                                                <Space
                                                  style={{
                                                    width: '100%',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'flex-start',
                                                  }}
                                                >
                                                  <Text strong>{card.title}</Text>
                                                  <Space size={4}>
                                                    <Button
                                                      type="text"
                                                      danger
                                                      icon={<DeleteOutlined />}
                                                      onClick={() => handleDeleteCard(card.previewId)}
                                                    />
                                                    <Button
                                                      type="text"
                                                      icon={<EditOutlined />}
                                                      onClick={() => handleOpenCardEditDrawer(card)}
                                                    />
                                                  </Space>
                                                </Space>
                                                <Text type="secondary">
                                                  <span
                                                    style={{
                                                      display: '-webkit-box',
                                                      WebkitLineClamp: 3,
                                                      WebkitBoxOrient: 'vertical',
                                                      overflow: 'hidden',
                                                    }}
                                                  >
                                                    {card.description}
                                                  </span>
                                                </Text>

                                                <div>
                                                  <Text
                                                    style={{
                                                      display: 'block',
                                                      fontSize: 11,
                                                      color: '#8b93a7',
                                                      marginBottom: 6,
                                                      textTransform: 'uppercase',
                                                    }}
                                                  >
                                                    {intl.formatMessage({ id: 'scrumboard.app.targetList' })}
                                                  </Text>
                                                  <Select
                                                    value={card.taskListId}
                                                    style={{ width: '100%' }}
                                                    options={getListOptions(card.boardId)}
                                                    onChange={targetColumnId =>
                                                      handleCardListChange(card, targetColumnId)
                                                    }
                                                  />
                                                </div>

                                                <div>
                                                  <Text
                                                    style={{
                                                      display: 'block',
                                                      fontSize: 11,
                                                      color: '#8b93a7',
                                                      marginBottom: 6,
                                                      textTransform: 'uppercase',
                                                    }}
                                                  >
                                                    {intl.formatMessage({ id: 'scrumboard.app.targetBoard' })}
                                                  </Text>
                                                  <Select
                                                    value={card.boardId}
                                                    style={{ width: '100%' }}
                                                    options={getBoardOptions()}
                                                    onChange={targetBoardId =>
                                                      handleCardBoardChange(card, targetBoardId)
                                                    }
                                                  />
                                                </div>
                                              </Space>
                                            </Card>
                                          ))}
                                        </Space>
                                      </div>
                                    ))}
                                </div>
                              </Panel>
                            </Collapse>
                          ))}
                        </Space>
                      </Space>
                    </div>
                  ) : (
                    <Empty description={intl.formatMessage({ id: 'scrumboard.app.emptyNoPreviews' })} />
                  )}
                </Panel>
              ))}
            </Collapse>
          </Space>
        ) : (
          <Empty
            description={
              previewLoading
                ? intl.formatMessage({ id: 'scrumboard.app.emptyLoading' })
                : intl.formatMessage({ id: 'scrumboard.app.emptyNone' })
            }
          />
        )}
      </Modal>

      <Modal
        title={intl.formatMessage({ id: 'scrumboard.app.listModalTitle' })}
        open={!!pendingBoardChange}
        onCancel={() => setPendingBoardChange(null)}
        footer={null}
        width={400}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Text>
            {intl.formatMessage(
              { id: 'scrumboard.app.listModalBody' },
              { title: pendingBoardChange?.card?.title || '' }
            )}
          </Text>
          <Select
            style={{ width: '100%' }}
            placeholder={intl.formatMessage({ id: 'scrumboard.app.listSelectPh' })}
            options={pendingBoardChange?.targetBoard?.taskLists?.map(list => ({
              label: list.name,
              value: list.id,
            }))}
            onChange={async (taskListId) => {
              const card = pendingBoardChange.card;
              await savePreviewUpdate({
                id: card.previewId,
                taskListId: taskListId,
                title: card.title,
                description: card.description,
                dueDate: card.dueDate,
              });
              setPendingBoardChange(null);
            }}
          />
        </Space>
      </Modal>
    </Layout>
  );
};

export default connect(null, {
  ...modalActions,
  ...scrumBoardActions,
  ...drawerActions,
})(AppLayout);
