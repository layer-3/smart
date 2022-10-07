//SPDX-License-Identifier: MIT
pragma solidity 0.8.16;

import '../YellowClearingBase.sol';
import './TESTYellowClearingV1.sol';

contract TESTYellowClearingV3 is YellowClearingBase {
    constructor(YellowClearingBase previousImplementation)
        YellowClearingBase(previousImplementation)
    {}

    function _migrateParticipantData(address participant, ParticipantData memory data)
        internal
        override
    {
        ParticipantData memory migratedData = ParticipantData(42, data.status);

        _participantData[participant] = migratedData;
    }
}
