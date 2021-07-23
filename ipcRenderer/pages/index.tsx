import React, { useEffect, useState } from 'react';
import { List, Modal, Button, Tooltip, Form, Row, Col, Input, Space, Empty, Checkbox, message } from 'antd';
import {
    EllipsisOutlined,
    UpOutlined,
    DownOutlined,
    MinusCircleOutlined,
    PlusOutlined,
    DeleteOutlined,
    MinusOutlined,
    ExclamationCircleFilled,
    CloseCircleFilled,
} from '@ant-design/icons';
import 'antd/dist/antd.css';
import '@/static/styles/index.less';
import { useModule } from '@/store/index';
import Utils from '@/utils';

const App = () => {
    const { node_path, electron, node_fs } = window;
    const { aria2cModule } = useModule();
    const [initLoading, setInitLoading] = useState<boolean>(false);
    const [visibleAddDownloadTaskModal, setVisibleAddDownloadTaskModal] = useState<boolean>(false);
    const [visibleDeleteDownloadTaskModal, setVisibleDeleteDownloadTaskModal] = useState<boolean>(false); //显示删除文件的模态窗
    const [deleteLocalFileCheckBox, setDeleteLocalFileCheckBox] = useState<boolean>(true); //是否删除本地文件
    const [curDeleteDownloadTaskInfo, setCurDeleteDownloadTaskInfo] = useState<any>({}); //当前正在删除的任务文件信息

    const [expand, setExpand] = useState(false);
    const [form] = Form.useForm();

    //验证所有表单格式是否正确
    const [validAllFormFormatStatus, setValidAllFormFormatStatus] = useState<boolean>(true);

    /**
     * 打开增加下载任务的的模态窗
     */
    const openAddDownloadTaskModal = async () => {
        let curAppPath = await electron.ipcRenderer.invoke('getDownloadDir');
        form.setFieldsValue({
            fileSavePath: localStorage.getItem('lastFileSavePath') || curAppPath,
        });
        setVisibleAddDownloadTaskModal(true);
    };

    /**
     * 关闭增加下载任务的的模态窗
     */
    const closeAddDownloadTaskModal = () => {
        setExpand(false);
        localStorage.setItem('lastFileSavePath', form.getFieldValue('fileSavePath'));
        form.resetFields();
        setVisibleAddDownloadTaskModal(false);
    };

    /**
     * 渲染增加下载任务的表单信息
     * @returns
     */
    const renderFormFields = () => {
        const initCol = [
            <Col span={24} key="1">
                <Form.Item
                    name="downloadUrl"
                    label="网址"
                    rules={[
                        {
                            required: true,
                            validator: (rule, value) => {
                                value = value ? value.trim() : '';
                                if (!value) {
                                    return Promise.reject('请输入下载网址');
                                } else if (!new RegExp('[a-zA-z]+://[^s]*').test(value)) {
                                    return Promise.reject('下载网址不合法');
                                } else if (value.replace(new RegExp('[a-zA-z]+://'), '').lastIndexOf('/') == -1) {
                                    return Promise.reject('下载网址不合法');
                                } else {
                                    return Promise.resolve();
                                }
                            },
                        },
                    ]}
                >
                    <Input placeholder="请输入下载网址" onBlur={onDownloadInputBlur} />
                </Form.Item>
            </Col>,
            <Col span={24} key="2">
                <Form.Item
                    name="fileName"
                    label="名称"
                    rules={[
                        {
                            required: true,
                            message: '请输入名称',
                        },
                    ]}
                >
                    <Input placeholder="请输入名称" />
                </Form.Item>
            </Col>,
            <Col span={24} key="3">
                <Form.Item
                    name="fileSavePath"
                    label="下载到"
                    rules={[
                        {
                            required: true,
                            validator: async (rule, value) => {
                                value = value ? value.trim() : '';
                                if (!value) {
                                    return Promise.reject('请选择保存地址');
                                }
                                let validResult = node_fs.existsSync(value);
                                if (validResult) {
                                    return Promise.resolve();
                                } else {
                                    return Promise.reject('保存地址不存在');
                                }
                            },
                        },
                    ]}
                >
                    <Input placeholder="请选择保存地址" addonAfter={<EllipsisOutlined className="icon" onClick={() => openSavePath()} />} />
                </Form.Item>
            </Col>,
        ];
        const expandCol = [
            <Col span={24} key="5" className="http-header-options">
                <>
                    <p>
                        Header 设置<small>/请求头设置</small>
                    </p>

                    <Form.List name="headers">
                        {(fields, { add, remove }) => {
                            return (
                                <>
                                    <div
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'baseline',
                                            width: '100%',
                                        }}
                                    >
                                        <div
                                            className="container"
                                            style={{
                                                display: 'inline-flex',
                                                width: '96%',
                                            }}
                                        >
                                            <Form.Item
                                                style={{
                                                    width: '100%',
                                                }}
                                            >
                                                <Input disabled defaultValue="User-Agent" />
                                            </Form.Item>
                                            <Form.Item
                                                style={{
                                                    width: '100%',
                                                    marginLeft: '10px',
                                                }}
                                            >
                                                <Input
                                                    disabled
                                                    defaultValue="Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36"
                                                />
                                            </Form.Item>
                                        </div>
                                    </div>
                                    {fields.map(field => {
                                        return (
                                            <div
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'baseline',
                                                    width: '100%',
                                                }}
                                                key={field.fieldKey}
                                            >
                                                <Form.Item
                                                    name={[field.name, 'key']}
                                                    rules={[{ required: true, message: '请输入Header key' }]}
                                                    style={{
                                                        width: '100%',
                                                    }}
                                                >
                                                    <Input placeholder="输入Header key" />
                                                </Form.Item>
                                                <Form.Item
                                                    name={[field.name, 'value']}
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message: '请输入参数Header，可为空',
                                                        },
                                                    ]}
                                                    style={{
                                                        width: '100%',
                                                        marginLeft: '10px',
                                                    }}
                                                >
                                                    <Input placeholder="输入参数Header，可为空" />
                                                </Form.Item>
                                                <MinusCircleOutlined
                                                    style={{
                                                        marginLeft: '6px',
                                                    }}
                                                    onClick={() => remove(field.name)}
                                                />
                                            </div>
                                        );
                                    })}
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            marginBottom: '20px',
                                        }}
                                    >
                                        <Button
                                            type="primary"
                                            onClick={() => add()}
                                            icon={<PlusOutlined />}
                                            style={{
                                                marginRight: '6px',
                                            }}
                                        >
                                            添加一项
                                        </Button>

                                        <Button type="primary" danger onClick={() => remove(fields.map(item => item.name))} icon={<MinusOutlined />}>
                                            移动所有新添加项
                                        </Button>
                                    </div>
                                </>
                            );
                        }}
                    </Form.List>
                </>
            </Col>,
        ];
        return expand ? initCol.concat(expandCol) : initCol;
    };

    /**
     * 当表单的字段有改变时的回调
     * @param changedFields
     * @param allFields
     */
    const onFormFieldsChange = (changedFields, allFields) => {
        let isError = allFields.map(i => i.errors.length).filter(j => j != 0);
        let isErrorLength = isError.length;
        isErrorLength ? setValidAllFormFormatStatus(true) : setValidAllFormFormatStatus(false);
    };

    /**
     * 当表单中的下载地址失去焦点的action
     * @returns
     */
    const onDownloadInputBlur = () => {
        let downloadUrlValue = form.getFieldValue('downloadUrl') || '';
        let downloadUrlValueError = form.getFieldError('downloadUrl');
        // 1、下载的地址为空 或者 下载的地址格式验证出错  直接返回 空字符串
        // 2、先把下载地址的协议头替换为空
        // 3、查找最后一个正向斜杆的位置
        // 4、如果没有找到正向斜杆，返回设置好的默认文件名（index.html）
        //    如果找到截取从正向斜杆的位置到最后字符串的位置，
        //       去除带有？的所有参数
        //       去除window下文件名不支持的特殊字符（/:*?"<>^）
        if (downloadUrlValue.length == 0 || downloadUrlValueError.length) {
            form.setFieldsValue({
                fileName: '',
            });
            return;
        } else {
            const defaultFileName = 'index.html';
            let matchFileName = downloadUrlValue.replace(new RegExp('[a-zA-z]+://'), '');
            let hasForwardSlash = matchFileName.lastIndexOf('/');
            if (hasForwardSlash == -1) {
                matchFileName = defaultFileName;
            } else {
                matchFileName = matchFileName.substring(hasForwardSlash + 1);
                if (matchFileName) {
                    matchFileName = matchFileName.match(/.[^?]*/g)[0];
                    matchFileName = matchFileName.replace(/\\|\/|\:|\*|\?|\"|\<|\>|\||\^/g, '_');
                } else {
                    matchFileName = defaultFileName;
                }
            }
            form.setFieldsValue({
                fileName: matchFileName,
            });
        }
    };

    /**
     * 当表单中的点击路径选择框
     */
    const openSavePath = async () => {
        let fileSavePath = await electron.ipcRenderer.invoke('openFileDialog', '');
        console.log(fileSavePath, 'fileSavePath');
        form.setFieldsValue({
            fileSavePath,
        });
        let isError = form
            .getFieldsError()
            .map(i => i.errors.length)
            .filter(j => j != 0);
        let isErrorLength = isError.length;
        isErrorLength ? setValidAllFormFormatStatus(true) : setValidAllFormFormatStatus(false);
    };

    /**
     * 向Aria2c添加下载任务
     * @param values
     */
    const handleAddDownloadTask = values => {
        let requestHeaders = new Map();
        try {
            // let urlFormat = new URL(values.downloadUrl);
            //去除下载地址的头尾空格
            values.downloadUrl=values.downloadUrl.trim();
            requestHeaders.set('referer', values.downloadUrl);
        } catch (error) {}
        if (values.headers) {
            values.headers.forEach(item => {
                requestHeaders.set(item.key, item.value);
            });
        }
        aria2cModule.addUris([values.downloadUrl], {
            dir: values.fileSavePath.replace(/\\\\/g, '\\'),
            header: Array.from(requestHeaders)
                .map(item => `${item[0]}:${item[1]}`)
                .join(' '),
        });
        setVisibleAddDownloadTaskModal(false);
        setExpand(false);
        form.resetFields();
    };

    /**
     * 解析任务列表
     * @returns
     */
    const parseTask = () => {
        return Array.from(aria2cModule.tasks.values());
    };

    /**
     * 渲染任务列表
     * @param data
     * @returns
     */
    const renderDescription = data => {
        const { status, totalLength, completedLength, errorMessage, downloadSpeed } = data;
        return (
            <div className="download-info">
                {status == 'complete' || status == 'noLocalFile' ? (
                    <span>{Utils.mertic(totalLength)}</span>
                ) : (
                    <span>
                        {Utils.mertic(completedLength)}/{Utils.mertic(totalLength) || '未知'}
                    </span>
                )}
                {status == 'removed' || status == 'noLocalFile' ? (
                    <span>文件已删除</span>
                ) : status == 'error' ? (
                    <span>下载失败：{errorMessage}</span>
                ) : status == 'complete' ? null : status == 'paused' ? (
                    <span>0 B/s</span>
                ) : (
                    <span>{Utils.mertic(downloadSpeed)}/s</span>
                )}
            </div>
        );
    };

    /**
     * 渲染动作
     * @param data
     * @returns
     */
    const renderAction = data => {
        const { status, files, gid, fileName } = data;
        // files[0].path 文件路径
        const actionsArr = [];
        switch (status) {
            case 'error':
                //由于aria2已经默认会把出错的下载，重试5次，所以这边就没有必要再次重新下载了，因为资源可能就是失效的
                // actionsArr.push(
                //   <Tooltip
                //     title="重新下载"
                //     getPopupContainer={(triggerNode) => triggerNode.parentElement}
                //   >
                //     <span
                //     // onClick={() => handleAddDownloadTask({ ...item, type: "restart" })}
                //     >
                //       重新下载
                //     </span>
                //   </Tooltip>
                // );
                break;
            case 'complete':
                actionsArr.push(
                    <>
                        <span onClick={() => handleOpenFileOrFolder('file', files[0].path, data)}>打开文件</span>
                        <span onClick={() => handleOpenFileOrFolder('folder', files[0].path, data)}>打开文件夹</span>
                    </>
                );
                break;
            case 'paused':
                actionsArr.push(
                    <Tooltip title="恢复下载" getPopupContainer={triggerNode => triggerNode.parentElement}>
                        {/* <PauseOutlined /> */}
                        <span onClick={() => aria2cModule.resumeTask(gid)}>开始</span>
                    </Tooltip>
                );
                break;
            case 'active':
            case 'waiting':
                actionsArr.push(
                    <Tooltip title="暂停" getPopupContainer={triggerNode => triggerNode.parentElement}>
                        {/* <PauseOutlined /> */}
                        <span onClick={() => aria2cModule.pauseTask(gid)}>暂停</span>
                    </Tooltip>
                );
                break;
        }
        actionsArr.push(
            <Tooltip title="删除" getPopupContainer={triggerNode => triggerNode.parentElement}>
                <span
                    onClick={() => {
                        setCurDeleteDownloadTaskInfo(data);
                        setVisibleDeleteDownloadTaskModal(true);
                    }}
                >
                    删除
                </span>
            </Tooltip>
        );
        return actionsArr;
    };

    /**
     * 渲染进度条
     * @param data
     * @returns
     */
    const renderProgress = data => {
        const { completedLength, totalLength } = data;
        const curProgress = completedLength / totalLength;
        return {
            width: `${Math.round(curProgress * 100)}%`,
        };
    };

    /**
     * 调用electron的方法，打开下载后的文件所在的目录/打开文件
     * @param type 文件类型 文件/文件夹
     * @param path 路径
     * @param rawData 原数据
     * @returns
     */
    const handleOpenFileOrFolder = (type: 'folder' | 'file', path: string, rawData) => {
        //适用于Windows和Mac的Node.js —正斜杠，反斜杠纠正
        path = node_path.normalize(path);
        if (!node_fs.existsSync(path)) {
            rawData.status = 'noLocalFile';
            aria2cModule.setNoLocalFileTasks('add', rawData);
            message.error({
                content: `未找到文件，${type == 'file' ? '文件' : '文件夹'}可能已经被删除了`,
                key: 'handleOpenFile',
            });
            return;
        }
        switch (type) {
            case 'folder':
                electron.shell.showItemInFolder(path);
                return;
            case 'file':
                electron.shell.openPath(path);
                return;
        }
    };

    /**
     * 取消删除下载任务的模态窗
     */
    const cancelDeleteDownloadTaskModal = () => {
        setDeleteLocalFileCheckBox(true);
        setCurDeleteDownloadTaskInfo({});
        setVisibleDeleteDownloadTaskModal(false);
    };

    /**
     * 删除下载任务（是否连同本地文件一起删除）
     */
    const handleDeleteDownloadTask = () => {
        // 1、通知aria2c把对应的下载任务队列删除了
        // 2、如有勾选删除本地文件的话，就要把对应的文件和临时缓存一起删除了
        aria2cModule.deleteTask(curDeleteDownloadTaskInfo.gid, curDeleteDownloadTaskInfo);
        aria2cModule.setNoLocalFileTasks('delete', curDeleteDownloadTaskInfo);

        if (deleteLocalFileCheckBox) {
            try {
                let path = node_path.normalize(curDeleteDownloadTaskInfo.files[0].path);
                node_fs.rmSync(path);
                node_fs.rmSync(path + '.aria2'); //临时缓存文件
            } catch (error) {
                console.log(error, '删除本地文件失败');
            }
        }

        cancelDeleteDownloadTaskModal();
    };

    /**
     * 清空所有已下载的
     */
    const cleanEmptyDownloadTask = () => {
        aria2cModule.cleanEmptyTask();
    };

    /**
     * 当组件加载完毕，通知主进程，关闭加载中的遮罩
     */
    useEffect(() => {
        electron.ipcRenderer.invoke('closeLoadingView');
    }, []);

    return (
        <div className="App">
            <List
                header={
                    <Space>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => openAddDownloadTaskModal()}
                            style={{
                                marginLeft: 10,
                            }}
                        >
                            新建下载
                        </Button>
                        <Button type="default" icon={<DeleteOutlined />} onClick={() => cleanEmptyDownloadTask()}>
                            清空已下载
                        </Button>
                    </Space>
                }
                locale={{
                    emptyText: <Empty description="您下载的文件将会出现在这里" />,
                }}
                className="download-list"
                loading={initLoading}
                itemLayout="horizontal"
                dataSource={parseTask()}
                renderItem={item => (
                    <List.Item className={`file-list status-${item.status}`} actions={renderAction(item)}>
                        <div className="progress" style={renderProgress(item)}></div>
                        <List.Item.Meta
                            avatar={
                                <>
                                    <img src={item.fileIcon} width={48} height={48} />
                                    {/* 如果文件目录被移除，则图标显示上没有文件
                  如果文件错误的话，有个错误的标志 */}
                                    {item.status == 'removed' || item.status == 'noLocalFile' ? (
                                        <CloseCircleFilled className="icon no-local-file" />
                                    ) : item.status == 'error' ? (
                                        <CloseCircleFilled className="icon download-fail" />
                                    ) : null}
                                </>
                            }
                            title={<p>{item.fileName}</p>}
                            description={renderDescription(item)}
                        />
                    </List.Item>
                )}
            />
            <Modal
                visible={visibleAddDownloadTaskModal}
                title="新建下载"
                footer={null}
                onCancel={closeAddDownloadTaskModal}
                wrapClassName="add-download-task-operate-box"
                centered
                keyboard={false}
                maskClosable={false}
            >
                <Form
                    form={form}
                    name="advanced_search"
                    className="add-download-task-operate-form"
                    onFinish={handleAddDownloadTask}
                    labelAlign="left"
                    labelCol={{ span: 4 }}
                    onFieldsChange={onFormFieldsChange}
                >
                    <Row gutter={24}>{renderFormFields()}</Row>
                    <Row>
                        <Col span={24} style={{ textAlign: 'right' }}>
                            <a
                                style={{ fontSize: 12, margin: '0 8px' }}
                                onClick={() => {
                                    setExpand(!expand);
                                }}
                            >
                                {expand ? <UpOutlined /> : <DownOutlined />} 展开更多
                            </a>
                            <Button
                                onClick={() => {
                                    form.resetFields();
                                }}
                            >
                                重置
                            </Button>
                            <Button type="primary" htmlType="submit" style={{ margin: '0 8px' }} disabled={validAllFormFormatStatus}>
                                下载
                            </Button>
                        </Col>
                    </Row>
                </Form>
            </Modal>
            <Modal
                title="删除下载任务"
                visible={visibleDeleteDownloadTaskModal}
                width={420}
                footer={null}
                onCancel={cancelDeleteDownloadTaskModal}
                wrapClassName="delete-download-task-box"
                centered
                keyboard={false}
                maskClosable={false}
            >
                <p>
                    <ExclamationCircleFilled className="delete-icon" />
                    您确认要将所选下载任务从列表中移除吗?
                </p>
                <p>
                    <div className="left">
                        <Checkbox onChange={e => setDeleteLocalFileCheckBox(e.target.checked)} checked={deleteLocalFileCheckBox}>
                            同时删除文件
                        </Checkbox>
                    </div>
                    <div className="right">
                        <Button type="primary" onClick={handleDeleteDownloadTask}>
                            确定
                        </Button>
                        <Button onClick={cancelDeleteDownloadTaskModal}>取消</Button>
                    </div>
                </p>
            </Modal>
        </div>
    );
};

export default App;
