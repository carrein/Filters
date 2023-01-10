import React, { createContext, useContext, useEffect, useMemo } from 'react';
import {
  useDepartmentsFilter,
  useDetectionTagsFilter,
  usePoliciesFilter,
  useReceivedFoldersFilter
} from 'Core/hooks/filters';
import { useIncident } from 'Core/contexts/incident';
import { useImmer } from 'use-immer';
import { useDispatch, useSelector } from 'react-redux';
import {
  ALERT_ACTION,
  BANNER_ACTION,
  DELETE_ACTION,
  IGNORE_ACTION,
  LABEL_ACTION,
  LOCK_USER_ACTION,
  MARK_AS_SAFE_ACTION,
  QUARANTINE_ACTION,
  PERMANENTLY_DELETE_ACTION,
  BLOCK_ACTION,
  WILL_AUTO_REMEDIATE_ACTION,
  INLINE_DLP_ENCRYPT_ACTION
} from 'Organisms/policy/redux/constants';
import {
  THREAT_INCIDENT_TYPE,
  ABUSE_INCIDENT_TYPE,
  DLP_INCIDENT_TYPE,
  EAC_INCIDENT_TYPE,
  actionText
} from 'Organisms/incidents/redux/constants';
import {
  isWarningBannerEnabled,
  isPermanentlyDeleteEnabled,
  isOutboundGatewayEnabled,
  isDlpEncryptionEnabled,
  isLockAccountAllowed,
  isPacTimelineEnabled
} from 'Molecules/settings/redux/permissions';
import { getAppType } from 'Util/configuration';
import { capitalizeWords } from 'Util/general';
import { useLocation } from 'react-router-dom';
import { useQueryParams } from 'Core/hooks/utils';
import {
  ACTION_STATE_OBJECT,
  ACTION_STATE_PARAMS_KEY,
  ACTION_TYPES_PARAMS_KEY,
  BOOKMARK_OBJECT,
  BOOKMARK_PARAMS_KEY,
  DEPARTMENT_ID_PARAMS_KEY,
  DETECTION_TAGS_PARAMS_KEY,
  GLOBAL_ATTACK_OBJECT,
  GLOBAL_ATTACK_PARAMS_KEY,
  POLICY_ID_PARAMS_KEY,
  PRIORITY_TYPES_OBJECT,
  PRIORITY_TYPE_PARAMS_KEY,
  RECEIVED_FOLDERS_PARAMS_KEY,
  RECIPIENT_ENGAGEMENT_FORWARD_OBJECT,
  RECIPIENT_ENGAGEMENT_FORWARD_PARAMS_KEY,
  RECIPIENT_ENGAGEMENT_REPLY_OBJECT,
  RECIPIENT_ENGAGEMENT_REPLY_PARAMS_KEY,
  SCL_SCORE_OBJECT,
  SCL_SCORE_PARAMS_KEY,
  TARGETED_ATTACK_OBJECT,
  TARGETED_ATTACK_PARAMS_KEY,
  USER_STATUS_OBJECT,
  USER_STATUS_PARAMS_KEY
} from '../../components/Filters/FilterGroups/FilterGroups.constants';

const IncidentFiltersContext = createContext();

const IncidentFiltersProvider = props => {
  const { search } = useLocation();
  const dispatch = useDispatch();
  const { incidentType } = useIncident();

  const appType = useSelector(state => state.configurations.type);
  const appInstance = getAppType(appType);
  /**
   * Retrieve all currently applied filters from the URL query params.
   */
  const [queryParams, setQueryParams] = useQueryParams([
    POLICY_ID_PARAMS_KEY,
    ACTION_TYPES_PARAMS_KEY,
    USER_STATUS_PARAMS_KEY,
    RECIPIENT_ENGAGEMENT_FORWARD_PARAMS_KEY,
    RECIPIENT_ENGAGEMENT_REPLY_PARAMS_KEY,
    GLOBAL_ATTACK_PARAMS_KEY,
    TARGETED_ATTACK_PARAMS_KEY,
    DETECTION_TAGS_PARAMS_KEY,
    BOOKMARK_PARAMS_KEY,
    DEPARTMENT_ID_PARAMS_KEY,
    SCL_SCORE_PARAMS_KEY,
    PRIORITY_TYPE_PARAMS_KEY,
    RECEIVED_FOLDERS_PARAMS_KEY,
    ACTION_STATE_PARAMS_KEY
  ]);

  /** * START DESTRUCT QUERY PARAMS FROM USEQUERYPARAMS HOOK ** */

  const remediationActionsQueryParams =
    queryParams?.[ACTION_TYPES_PARAMS_KEY] ?? [];
  const actionStateQueryParams = queryParams?.[ACTION_STATE_PARAMS_KEY] ?? [];
  const userStatusQueryParams = queryParams?.[USER_STATUS_PARAMS_KEY] ?? '';
  const recipientEngagementForwardQueryParams =
    queryParams?.[RECIPIENT_ENGAGEMENT_FORWARD_PARAMS_KEY] ?? '';
  const recipientEngagementReplyQueryParams =
    queryParams?.[RECIPIENT_ENGAGEMENT_REPLY_PARAMS_KEY] ?? '';
  const globalAttackQueryParams = queryParams?.[GLOBAL_ATTACK_PARAMS_KEY] ?? '';
  const targetedAttackQueryParams =
    queryParams?.[TARGETED_ATTACK_PARAMS_KEY] ?? '';
  const bookmarkQueryParams = queryParams?.[BOOKMARK_PARAMS_KEY] ?? '';
  const sclScoresQueryParams = queryParams?.[SCL_SCORE_PARAMS_KEY] ?? [];
  const priorityTypesQueryParams =
    queryParams?.[PRIORITY_TYPE_PARAMS_KEY] ?? [];

  /**
   * These query params need to be memoized because the available
   * options of the filters are dynamic.
   */
  const policyIdsQueryParams = useMemo(
    () => queryParams?.[POLICY_ID_PARAMS_KEY] ?? [],
    [queryParams]
  );
  const detectionTagsQueryParams = useMemo(
    () => queryParams?.[DETECTION_TAGS_PARAMS_KEY] ?? [],
    [queryParams]
  );
  const departmentsQueryParams = useMemo(
    () => queryParams?.[DEPARTMENT_ID_PARAMS_KEY] ?? [],
    [queryParams]
  );
  const receivedFoldersQueryParams = useMemo(
    () => queryParams?.[RECEIVED_FOLDERS_PARAMS_KEY] ?? [],
    [queryParams]
  );

  /** * END DESTRUCT QUERY PARAMS FROM USEQUERYPARAMS HOOK ** */
  /** * START FETCH AVAILABLE OPTIONS FOR DYNAMIC FILTERS ** */

  const {
    data: policiesData,
    isLoading: arePoliciesLoading,
    error: policiesError
  } = usePoliciesFilter(incidentType);
  const {
    data: detectionTagsData,
    isLoading: areDetectionTagsLoading,
    error: detectionTagsError
  } = useDetectionTagsFilter();
  const {
    data: departmentsData,
    isLoading: areDepartmentsLoading,
    error: departmentsError
  } = useDepartmentsFilter(incidentType);
  const {
    data: receivedFoldersData,
    isLoading: areReceivedFoldersLoading,
    error: receivedFoldersError
  } = useReceivedFoldersFilter(appInstance);

  /** * END FETCH AVAILABLE OPTIONS FOR DYNAMIC FILTERS ** */
  /** * START PREPARE INITIAL OBJECTS OF FILTERS ** */

  /**
   * For filters that operate with checkboxes and dropdowns, augment the options
   * object with a checked property based on the query params retrieved.
   */
  const initPolicies = useMemo(
    () =>
      policiesData?.policies?.map(policy => ({
        policyId: policy?.id ?? '',
        policyName: policy?.name ?? '',
        policyNameKey: policy?.policy_name ?? '',
        policyEnabled: policy?.is_enabled ?? false,
        checked: policyIdsQueryParams.includes(policy?.id ?? '')
      })) ?? [],
    [policiesData?.policies, policyIdsQueryParams]
  );
  const initDetectionTags = useMemo(
    () =>
      detectionTagsData?.detection_tags?.map(tag => ({
        value: tag?.detection_tag_id ?? '',
        label: capitalizeWords(tag?.detection_tag_name ?? ''),
        checked: detectionTagsQueryParams.includes(tag?.detection_tag_id ?? '')
      })) ?? [],
    [detectionTagsData?.detection_tags, detectionTagsQueryParams]
  );
  /**
   * incidents:getFoldersListFilter returns an array of folders with no ID.
   * Thus, we use the items in the array for the value and label pair.
   */
  const initReceivedFolders = useMemo(
    () =>
      receivedFoldersData?.folders?.map(folder => ({
        value: folder,
        label: folder,
        checked: receivedFoldersQueryParams.includes(folder)
      })),
    [receivedFoldersData?.folders, receivedFoldersQueryParams]
  );
  /**
   * incidents:getDepartmentFilter returns department IDs as a integer instead of a string.
   */
  const initDepartments = useMemo(
    () =>
      departmentsData?.departments?.map(department => ({
        value: department?.id.toString() ?? '',
        label: department?.name ?? '',
        checked: departmentsQueryParams.includes(
          department?.id.toString() ?? ''
        )
      })),
    [departmentsData?.departments, departmentsQueryParams]
  );

  /**
   * Note: query params are all string type hence the boolean true cast.
   */
  const initGlobalAttack = {
    ...GLOBAL_ATTACK_OBJECT,
    checked: globalAttackQueryParams.includes('true')
  };
  const initTargetedAttack = {
    ...TARGETED_ATTACK_OBJECT,
    checked: targetedAttackQueryParams.includes('true')
  };
  const initRecipientEngagementReply = {
    ...RECIPIENT_ENGAGEMENT_REPLY_OBJECT,
    checked: recipientEngagementReplyQueryParams.includes('true')
  };
  const initRecipientEngagementForward = {
    ...RECIPIENT_ENGAGEMENT_FORWARD_OBJECT,
    checked: recipientEngagementForwardQueryParams.includes('true')
  };
  const initBookmark = {
    ...BOOKMARK_OBJECT,
    checked: bookmarkQueryParams.includes(BOOKMARK_OBJECT.value)
  };
  const initUserStatus = {
    ...USER_STATUS_OBJECT,
    checked: userStatusQueryParams.includes(USER_STATUS_OBJECT.value)
  };
  const initSclScore = SCL_SCORE_OBJECT?.map(sclScoreOption => ({
    ...sclScoreOption,
    checked: sclScoreOption.value.every(sclScore =>
      sclScoresQueryParams.includes(sclScore)
    )
  }));
  const initPriority = PRIORITY_TYPES_OBJECT?.map(priority => ({
    ...priority,
    checked: priorityTypesQueryParams.includes(priority.value)
  }));
  const initActionStateFilter = ACTION_STATE_OBJECT?.map(actionState => ({
    ...actionState,
    checked: actionStateQueryParams.includes(actionState.value)
  }));

  /**
   * Prepare the initial object for remediation filters.
   */
  const nonDlpOrEacType = ![DLP_INCIDENT_TYPE, EAC_INCIDENT_TYPE].includes(
    incidentType
  );
  let remediationActions =
    incidentType === THREAT_INCIDENT_TYPE
      ? [WILL_AUTO_REMEDIATE_ACTION, DELETE_ACTION]
      : incidentType === EAC_INCIDENT_TYPE
      ? [ALERT_ACTION]
      : [ALERT_ACTION, DELETE_ACTION];

  if (nonDlpOrEacType) {
    remediationActions = [...remediationActions, QUARANTINE_ACTION];
  }
  remediationActions = [...remediationActions, MARK_AS_SAFE_ACTION];
  if (
    EAC_INCIDENT_TYPE === incidentType &&
    dispatch(isPacTimelineEnabled()) &&
    dispatch(isLockAccountAllowed())
  ) {
    remediationActions = [...remediationActions, LOCK_USER_ACTION];
  }
  if (nonDlpOrEacType) {
    remediationActions = [...remediationActions, LABEL_ACTION];
  }
  remediationActions = [...remediationActions, IGNORE_ACTION];
  if (
    incidentType === THREAT_INCIDENT_TYPE &&
    dispatch(isWarningBannerEnabled())
  ) {
    remediationActions = [...remediationActions, BANNER_ACTION];
  }
  if (
    ![ABUSE_INCIDENT_TYPE, EAC_INCIDENT_TYPE].includes(incidentType) &&
    dispatch(isPermanentlyDeleteEnabled())
  ) {
    remediationActions = [...remediationActions, PERMANENTLY_DELETE_ACTION];
  }
  if (
    incidentType === DLP_INCIDENT_TYPE &&
    dispatch(isOutboundGatewayEnabled())
  ) {
    remediationActions = [...remediationActions, BLOCK_ACTION];
  }
  if (
    incidentType === DLP_INCIDENT_TYPE &&
    dispatch(isDlpEncryptionEnabled())
  ) {
    remediationActions = [...remediationActions, INLINE_DLP_ENCRYPT_ACTION];
  }

  const initRemediationActions = remediationActions?.map(remediationAction => ({
    remediationName: actionText[remediationAction],
    remediationActionType: remediationAction,
    checked: remediationActionsQueryParams.includes(remediationAction)
  }));

  /** * END PREPARE INITIAL OBJECTS OF FILTERS ** */
  /** * START PREPARE WORKING STATES OF FILTERS ** */

  /**
   * Declare intermediate working states for filters.
   * These states are required as the filters are not written to the URL immediately,
   * rather the user has to apply them manually.
   */
  const [workingPolicyFilters, setWorkingPolicyFilters] = useImmer([]);
  const [workingDetectionTagsFilters, setWorkingDetectionTagsFilters] =
    useImmer([]);
  const [workingDepartmentsFilters, setWorkingDepartmentsFilters] = useImmer(
    []
  );
  const [workingReceivedFoldersFilters, setWorkingReceivedFoldersFilters] =
    useImmer([]);
  const [workingGlobalAttackFilters, setWorkingGlobalAttackFilters] =
    useImmer(initGlobalAttack);
  const [workingTargetedAttackFilters, setWorkingTargetedAttackFilters] =
    useImmer(initTargetedAttack);
  const [workingBookmarkFilters, setWorkingBookmarkFilters] =
    useImmer(initBookmark);
  const [workingSclScoresFilters, setWorkingSclScoresFilters] =
    useImmer(initSclScore);
  const [workingPriorityTypeFilters, setWorkingPriorityTypeFilters] =
    useImmer(initPriority);
  const [workingActionStateFilters, setWorkingActionStateFilters] = useImmer(
    initActionStateFilter
  );
  const [
    workingRemediationActionsFilters,
    setWorkingRemediationActionsFilters
  ] = useImmer(initRemediationActions);
  const [workingUsersFilters, setWorkingUsersFilters] =
    useImmer(initUserStatus);
  const [
    workingRecipientEngagementReplyFilters,
    setWorkingRecipientEngagementReplyFilters
  ] = useImmer(initRecipientEngagementReply);
  const [
    workingRecipientEngagementForwardFilters,
    setWorkingRecipientEngagementForwardFilters
  ] = useImmer(initRecipientEngagementForward);

  /** * END PREPARE WORKING STATES OF FILTERS ** */

  /**
   * Set working state with the initial objects of the filters.
   */
  useEffect(() => {
    if (!arePoliciesLoading && !policiesError)
      setWorkingPolicyFilters(initPolicies);
    if (!areDetectionTagsLoading && !detectionTagsError)
      setWorkingDetectionTagsFilters(initDetectionTags);
    if (!areDepartmentsLoading && !departmentsError)
      setWorkingDepartmentsFilters(initDepartments);
    if (!areReceivedFoldersLoading && !receivedFoldersError)
      setWorkingReceivedFoldersFilters(initReceivedFolders);
    setWorkingRemediationActionsFilters(initRemediationActions);
    setWorkingUsersFilters(initUserStatus);
    setWorkingRecipientEngagementReplyFilters(initRecipientEngagementReply);
    setWorkingRecipientEngagementForwardFilters(initRecipientEngagementForward);
    setWorkingGlobalAttackFilters(initGlobalAttack);
    setWorkingTargetedAttackFilters(initTargetedAttack);
    setWorkingBookmarkFilters(initBookmark);
    setWorkingSclScoresFilters(initSclScore);
    setWorkingPriorityTypeFilters(initPriority);
    setWorkingActionStateFilters(initActionStateFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    arePoliciesLoading,
    areDetectionTagsLoading,
    areDepartmentsLoading,
    areReceivedFoldersLoading
  ]);

  /**
   *  Reset the working policies to the initial state.
   */
  const resetWorkingState = () => {
    setWorkingPolicyFilters(initPolicies);
    setWorkingRemediationActionsFilters(initRemediationActions);
    setWorkingUsersFilters(initUserStatus);
    setWorkingRecipientEngagementReplyFilters(initRecipientEngagementReply);
    setWorkingRecipientEngagementForwardFilters(initRecipientEngagementForward);
    setWorkingGlobalAttackFilters(initGlobalAttack);
    setWorkingTargetedAttackFilters(initTargetedAttack);
    setWorkingBookmarkFilters(initBookmark);
    setWorkingDetectionTagsFilters(initDetectionTags);
    setWorkingDepartmentsFilters(initDepartments);
    setWorkingSclScoresFilters(initSclScore);
    setWorkingPriorityTypeFilters(initPriority);
    setWorkingReceivedFoldersFilters(initReceivedFolders);
    setWorkingActionStateFilters(initActionStateFilter);
  };

  /**
   * Helper function to set all options of a filters.
   */
  const setAllFiltersCallback = (setState, checked) => {
    setState(draft => {
      if (Array.isArray(draft)) {
        draft.forEach(x => {
          x.checked = checked;
        });
        return;
      }
      draft.checked = checked;
    });
  };

  const handleSetWorkingPolicyFilters = checked =>
    setAllFiltersCallback(setWorkingPolicyFilters, checked);
  const handleSetWorkingRemediationActionsFilters = checked =>
    setAllFiltersCallback(setWorkingRemediationActionsFilters, checked);
  const handleSetWorkingUsersFilters = checked =>
    setAllFiltersCallback(setWorkingUsersFilters, checked);
  const handleSetWorkingRecipientEngagementReplyFilters = checked =>
    setAllFiltersCallback(setWorkingRecipientEngagementReplyFilters, checked);
  const handleSetWorkingRecipientEngagementForwardFilters = checked =>
    setAllFiltersCallback(setWorkingRecipientEngagementForwardFilters, checked);
  const handleSetWorkingDetectionTagsFilters = checked =>
    setAllFiltersCallback(setWorkingDetectionTagsFilters, checked);
  const handleSetWorkingDepartmentsFilters = checked =>
    setAllFiltersCallback(setWorkingDepartmentsFilters, checked);
  const handleSetWorkingSclScoresFilters = checked =>
    setAllFiltersCallback(setWorkingSclScoresFilters, checked);
  const handleSetWorkingPriorityTypeFilters = checked =>
    setAllFiltersCallback(setWorkingPriorityTypeFilters, checked);
  const handleSetWorkingReceivedFoldersFilters = checked =>
    setAllFiltersCallback(setWorkingReceivedFoldersFilters, checked);

  const clearAllWorkingStatesAndQueryParams = () => {
    handleSetWorkingPolicyFilters(false);
    handleSetWorkingRemediationActionsFilters(false);
    handleSetWorkingUsersFilters(false);
    handleSetWorkingRecipientEngagementReplyFilters(false);
    handleSetWorkingRecipientEngagementForwardFilters(false);
    handleSetWorkingDetectionTagsFilters(false);
    handleSetWorkingDepartmentsFilters(false);
    handleSetWorkingSclScoresFilters(false);
    handleSetWorkingPriorityTypeFilters(false);
    handleSetWorkingReceivedFoldersFilters(false);
    setQueryParams([]);
  };

  /**
   * Navigating away from the current page will clear all filters.
   */
  useEffect(() => {
    if (!search) clearAllWorkingStatesAndQueryParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  /**
   *  Commit the working state of the filters to the query params.
   */
  const commitWorkingState = () => {
    setQueryParams({
      [POLICY_ID_PARAMS_KEY]: workingPolicyFilters
        .filter(policy => policy.checked)
        .map(checkedPolicy => checkedPolicy.policyId),
      [ACTION_TYPES_PARAMS_KEY]: workingRemediationActionsFilters
        .filter(remediationAction => remediationAction.checked)
        .map(
          checkedRemediationAction =>
            checkedRemediationAction.remediationActionType
        ),
      [DETECTION_TAGS_PARAMS_KEY]: workingDetectionTagsFilters
        .filter(tag => tag.checked)
        .map(checkedTags => checkedTags.value),
      [DEPARTMENT_ID_PARAMS_KEY]: workingDepartmentsFilters
        .filter(departments => departments.checked)
        .map(checkedDepartments => checkedDepartments.value),
      [SCL_SCORE_PARAMS_KEY]: workingSclScoresFilters
        .filter(sclScores => sclScores.checked)
        .map(checkedSclScores => checkedSclScores.value)
        .flat(),
      [PRIORITY_TYPE_PARAMS_KEY]: workingPriorityTypeFilters
        .filter(priorityType => priorityType.checked)
        .map(checkedPriorityType => checkedPriorityType.value),
      [RECEIVED_FOLDERS_PARAMS_KEY]: workingReceivedFoldersFilters
        .filter(receivedFolders => receivedFolders.checked)
        .map(checkedReceivedFolders => checkedReceivedFolders.value),
      [ACTION_STATE_PARAMS_KEY]: workingActionStateFilters
        .filter(actionState => actionState.checked)
        .map(checkedActionState => checkedActionState.value),
      ...(workingUsersFilters.checked && {
        [USER_STATUS_PARAMS_KEY]: workingUsersFilters.value
      }),
      ...(workingRecipientEngagementReplyFilters.checked && {
        [RECIPIENT_ENGAGEMENT_REPLY_PARAMS_KEY]: 'true'
      }),
      ...(workingRecipientEngagementForwardFilters.checked && {
        [RECIPIENT_ENGAGEMENT_FORWARD_PARAMS_KEY]: 'true'
      }),
      ...(workingGlobalAttackFilters.checked && {
        [GLOBAL_ATTACK_PARAMS_KEY]: 'true'
      }),
      ...(workingTargetedAttackFilters.checked && {
        [TARGETED_ATTACK_PARAMS_KEY]: 'true'
      }),
      ...(workingBookmarkFilters.checked && {
        [BOOKMARK_PARAMS_KEY]: workingBookmarkFilters.value
      })
    });
  };

  const areAnyFiltersApplied = Object.values(queryParams).flat().length > 0;

  /**
   * State and functions to batch toggle all options of a filter.
   */
  const areAllPolicyFiltersChecked = workingPolicyFilters.every(
    policy => policy.checked
  );
  const areAllRemediationActionsChecked =
    workingRemediationActionsFilters.every(remediation => remediation.checked);
  const areAllUsersFiltersChecked =
    workingUsersFilters.checked &&
    workingRecipientEngagementReplyFilters.checked &&
    workingRecipientEngagementForwardFilters.checked;

  const handleToggleAllPolicyFilters = () =>
    handleSetWorkingPolicyFilters(!areAllPolicyFiltersChecked);
  const handleToggleAllRemediationActionsFilters = () =>
    handleSetWorkingRemediationActionsFilters(!areAllRemediationActionsChecked);
  const handleToggleAllUsersFilters = () => {
    handleSetWorkingUsersFilters(!areAllUsersFiltersChecked);
    handleSetWorkingRecipientEngagementForwardFilters(
      !areAllUsersFiltersChecked
    );
    handleSetWorkingRecipientEngagementReplyFilters(!areAllUsersFiltersChecked);
  };

  /**
   * Iterate the current working policies and determine if they fit the
   * set of policies in a given predefined filters inclusion/exclusion list.
   */
  const isPredefinedFilterActive = (includedPolicies, excludedPolicies) => {
    const tempPolicyFilters =
      includedPolicies ??
      workingPolicyFilters
        .map(policy => policy.policyNameKey)
        .filter(policy => !excludedPolicies.includes(policy));

    /**
     * For all policies in the predefined filters set, determine if they are
     * checked or not.
     */
    return workingPolicyFilters.every(policy => {
      const isPolicyChecked = policy?.checked ?? false;
      return tempPolicyFilters.includes(policy.policyNameKey)
        ? isPolicyChecked
        : !isPolicyChecked;
    });
  };

  const handleTogglePredefinedFilters = (
    includedPolicies,
    excludedPolicies
  ) => {
    /**
     * If the filter is currently active, selecting it will simply reset the filter state.
     */
    if (isPredefinedFilterActive(includedPolicies, excludedPolicies)) {
      clearAllWorkingStatesAndQueryParams();
    } else {
      /**
       * Otherwise, we generate the set of policies included in the predefined filter set.
       */
      const tempPolicyFilters =
        includedPolicies ??
        workingPolicyFilters
          .map(policy => policy.policyNameKey)
          .filter(policy => !excludedPolicies.includes(policy));

      /**
       * Then, we reset the work state of the filters to false, and only set all policies
       * matching the predefined filter set to true.
       */
      const predefinedWorkingPolicyFilters = workingPolicyFilters
        .map(policy => ({
          ...policy,
          checked: false
        }))
        .map(policy => {
          if (tempPolicyFilters.includes(policy.policyNameKey)) {
            return { ...policy, checked: true };
          }
          return policy;
        });

      /**
       * Synonymous logic as above but done immutably.
       * We have to perform this logic twice since seState is asynchronous.
       */
      setWorkingPolicyFilters(draft => {
        draft.forEach(policy => {
          if (tempPolicyFilters.includes(policy.policyNameKey)) {
            policy.checked = true;
            return;
          }
          policy.checked = false;
        });
      });

      /**
       * Finally set the query parameters manually to the new filter state.
       * This is done because the working state is applied immediately.
       */
      setQueryParams({
        [POLICY_ID_PARAMS_KEY]: predefinedWorkingPolicyFilters
          .filter(policy => policy.checked)
          .map(checkedPolicy => checkedPolicy.policyId)
      });
    }
  };

  const handleToggleWorkingPolicyFilters = id => {
    setWorkingPolicyFilters(draft => {
      const index = draft.findIndex(x => x.policyId === id);
      if (index !== -1) draft[index].checked = !draft[index].checked;
    });
  };

  const handleToggleWorkingRemediationActionsFilters =
    remediationActionType => {
      setWorkingRemediationActionsFilters(draft => {
        const index = draft.findIndex(
          x => x.remediationActionType === remediationActionType
        );
        if (index !== -1) draft[index].checked = !draft[index].checked;
      });
    };

  const handleToggleWorkingActionStateFilters = value => {
    setWorkingActionStateFilters(draft => {
      const index = draft.findIndex(x => x.value === value);
      if (index !== -1) draft[index].checked = !draft[index].checked;
    });
  };

  const handleToggleWorkingUsersFilters = () => {
    setWorkingUsersFilters(draft => {
      draft.checked = !draft.checked;
    });
  };
  const handleToggleWorkingRecipientEngagementReplyFilters = () => {
    setWorkingRecipientEngagementReplyFilters(draft => {
      draft.checked = !draft.checked;
    });
  };
  const handleToggleWorkingRecipientEngagementForwardFilters = () => {
    setWorkingRecipientEngagementForwardFilters(draft => {
      draft.checked = !draft.checked;
    });
  };
  const handleToggleWorkingGlobalAttackFilters = () => {
    setWorkingGlobalAttackFilters(draft => {
      draft.checked = !draft.checked;
    });
  };
  const handleToggleWorkingTargetedAttackFilters = () => {
    setWorkingTargetedAttackFilters(draft => {
      draft.checked = !draft.checked;
    });
  };
  const handleToggleWorkingBookmarkFilters = () => {
    setWorkingBookmarkFilters(draft => {
      draft.checked = !draft.checked;
    });
  };

  /**
   * Callback methods to help toggle dropdown.
   */
  const handleDropdownFiltersCallback = (setAllState, setState, selection) => {
    if (!selection.length) {
      setAllState(false);
      return;
    }
    const labels = selection.map(s => s.value);
    setState(draft => {
      draft.forEach(x => {
        x.checked = labels.includes(x.value);
      });
    });
  };

  /**
   * Callback methods to help toggle SCL score dropdown.
   * Specifically, we use label as the key to match checked options since
   * values are an array of SCL values instead of a plain string.
   */
  const handleDropdownFilterCallbackLabel = (
    setAllState,
    setState,
    selection
  ) => {
    if (!selection.length) {
      setAllState(false);
      return;
    }
    const labels = selection.map(s => s.label);
    setState(draft => {
      draft.forEach(x => {
        x.checked = labels.includes(x.label);
      });
    });
  };

  const handleToggleWorkingDetectionTagsFilters = selection =>
    handleDropdownFiltersCallback(
      handleSetWorkingDetectionTagsFilters,
      setWorkingDetectionTagsFilters,
      selection
    );
  const handleToggleWorkingDepartmentsFilters = selection =>
    handleDropdownFiltersCallback(
      handleSetWorkingDepartmentsFilters,
      setWorkingDepartmentsFilters,
      selection
    );
  const handleToggleWorkingSclScoresFilters = selection =>
    handleDropdownFilterCallbackLabel(
      handleSetWorkingSclScoresFilters,
      setWorkingSclScoresFilters,
      selection
    );
  const handleToggleWorkingPriorityTypeFilters = selection =>
    handleDropdownFiltersCallback(
      handleSetWorkingPriorityTypeFilters,
      setWorkingPriorityTypeFilters,
      selection
    );
  const handleToggleWorkingReceivedFoldersFilters = selection =>
    handleDropdownFiltersCallback(
      handleSetWorkingReceivedFoldersFilters,
      setWorkingReceivedFoldersFilters,
      selection
    );

  const value = {
    // Policies Filters.
    areAllPolicyFiltersChecked,
    arePoliciesLoading,
    workingPolicyFilters,
    handleToggleAllPolicyFilters,
    handleToggleWorkingPolicyFilters,

    // Remediation Filters.
    areAllRemediationActionsChecked,
    workingRemediationActionsFilters,
    handleToggleAllRemediationActionsFilters,
    handleToggleWorkingRemediationActionsFilters,

    // Users Filters.
    areAllUsersFiltersChecked,
    workingUsersFilters,
    workingRecipientEngagementReplyFilters,
    workingRecipientEngagementForwardFilters,
    handleToggleAllUsersFilters,
    handleToggleWorkingUsersFilters,
    handleToggleWorkingRecipientEngagementReplyFilters,
    handleToggleWorkingRecipientEngagementForwardFilters,

    // Incident Tags Filters.
    areDetectionTagsLoading,
    workingDetectionTagsFilters,
    handleToggleWorkingDetectionTagsFilters,

    // Departments Filters.
    areDepartmentsLoading,
    workingDepartmentsFilters,
    handleToggleWorkingDepartmentsFilters,

    // Threat Scopes Filters.
    workingGlobalAttackFilters,
    workingTargetedAttackFilters,
    handleToggleWorkingGlobalAttackFilters,
    handleToggleWorkingTargetedAttackFilters,

    // Other Filters.
    workingBookmarkFilters,
    handleToggleWorkingBookmarkFilters,
    workingActionStateFilters,
    handleToggleWorkingActionStateFilters,

    // SCL Scores Filters.
    workingSclScoresFilters,
    handleToggleWorkingSclScoresFilters,

    // Priority Types Filters.
    workingPriorityTypeFilters,
    handleToggleWorkingPriorityTypeFilters,

    // Received Folders Filters.
    areReceivedFoldersLoading,
    workingReceivedFoldersFilters,
    handleToggleWorkingReceivedFoldersFilters,

    // Functions related to filter's working state.
    areAnyFiltersApplied,
    resetWorkingState,
    commitWorkingState,
    clearAllWorkingStatesAndQueryParams,

    // Functions related to predefined working state.
    isPredefinedFilterActive,
    handleTogglePredefinedFilters
  };

  return <IncidentFiltersContext.Provider value={value} {...props} />;
};

const useIncidentFiltersContext = () => {
  const context = useContext(IncidentFiltersContext);
  if (context === undefined) {
    throw new Error(
      'useIncidentFiltersContext must be used within a IncidentFiltersProvider'
    );
  }
  return context;
};

export { IncidentFiltersProvider, useIncidentFiltersContext };
