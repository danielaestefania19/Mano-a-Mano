// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./SavingsCircleFactory.sol";

/**
 * @title SavingsCircle
 * @notice Fully autonomous and trustless rotating savings contract (“tanda”) with integrated insurance-backed security.
 *
 * @dev Designed to operate entirely without intermediaries:
 *      - Participants self-manage all deposits and rounds.
 *      - No admin intervention is required at any point.
 *      - Includes an internal insurance pool for protection against default.
 *
 * Core mechanics:
 * - Each participant deposits an insurance collateral when joining.
 * - The tanda starts automatically when all participants have joined.
 * - Each round randomly selects a beneficiary.
 * - If all contribute, funds are released to the beneficiary.
 * - If a participant fails to contribute, the insurance pool covers the missing amount.
 * - If insurance is insufficient, all contributors are refunded and the tanda ends.
 * - Upon completion, participants recover their insurance deposits.
 */
contract SavingsCircle is Ownable, ReentrancyGuard {
    using Address for address payable;

    /**
     * @notice Defines the possible lifecycle states of a round.
     */
    enum RoundStatus {
        NotStarted,
        Active,
        Completed,
        Failed,
        Cancelled
    }

    /**
     * @notice Represents a savings round with tracking details.
     * @param index Sequential identifier of the round.
     * @param totalCollected Amount contributed so far in the round.
     * @param beneficiary Address selected to receive pooled funds.
     * @param status Current round state (active, completed, failed, etc).
     * @param startTime Block timestamp when round started.
     * @param endTime Block timestamp when round ends.
     */
    struct Round {
        uint256 index;
        uint256 totalCollected;
        address beneficiary;
        RoundStatus status;
        uint256 startTime;
        uint256 endTime;
    }

    /**
     * @notice Represents a participant in the tanda.
     * @param wallet Wallet address of the participant.
     * @param name Optional display name for UI use.
     */
    struct Participant {
        address wallet;
    }

    /**
     * @notice Simplified struct used to display all round schedules in frontends.
     */
    struct RoundSchedule {
        uint256 index;
        address beneficiary;
        uint256 startTime;
        uint256 endTime;
        RoundStatus status;
    }

    /// @notice Name of the savings circle (for UI and indexing).
    string public name;

    /// @notice Optional metadata URI or IPFS hash.
    string public image;

    /// @notice Reference to the factory that deployed this circle.
    address public factory;

    /// @notice Index of the current active round.
    uint256 public currentRound;

    /// @notice Maximum number of participants in this tanda.
    uint256 public totalParticipants;

    /// @notice Fixed contribution amount per participant per round.
    uint256 public contributionAmount;

    /// @notice Duration (in seconds) of each round.
    uint256 public roundDuration;

    /// @notice Boolean flag marking whether the circle was cancelled.
    bool public circleCancelled = false;

    /// @notice Array of all registered participants.
    Participant[] public participants;

    /// @notice Tracks whether an address has joined.
    mapping(address => bool) public isParticipant;

    /// @notice Tracks whether a participant has already received funds.
    mapping(address => bool) public hasReceived;

    /// @notice Tracks whether a participant has contributed in a given round.
    mapping(uint256 => mapping(address => bool)) public hasContributed;

    /// @notice List of all rounds.
    Round[] public rounds;

    /// @notice Fixed collateral deposit required from each participant.
    uint256 public insuranceDeposit;

    /// @notice Tracks each participant’s individual insurance balance.
    mapping(address => uint256) public insuranceBalance;

    /// @notice Tracks whether each participant remained compliant through all rounds.
    mapping(address => bool) public wasCompliant;

    /**
     * @notice Emitted when a new participant successfully joins the circle.
     */
    event ParticipantJoined(address indexed participant);

    /**
     * @notice Emitted when a new round starts.
     */
    event RoundCreated(
        uint256 indexed index,
        address indexed beneficiary,
        uint256 startTime,
        uint256 endTime
    );

    /**
     * @notice Emitted when a participant contributes to the active round.
     */
    event ContributionReceived(address indexed participant, uint256 amount);

    /**
     * @notice Emitted when the collected funds are released to the beneficiary.
     */
    event FundsReleased(
        uint256 indexed index,
        address indexed beneficiary,
        uint256 amount
    );

    /**
     * @notice Emitted when all funds are refunded due to failure.
     */
    event RefundIssued(uint256 indexed roundIndex);

    /**
     * @notice Emitted when the entire circle is cancelled due to round failure.
     */
    event CircleCancelled(uint256 failedRound);

    /**
     * @notice Emitted when insurance funds are used to cover a failed payment.
     */
    event InsuranceUsed(uint256 indexed roundIndex, uint256 amountUsed);

    /**
     * @notice Emitted when participants’ insurance deposits are returned.
     */
    event InsuranceRefunded(address indexed user, uint256 amount);

    /**
     * @notice Emitted when a participant defaults (fails to pay and their insurance is used).
     */
    event ParticipantDefaulted(
        address indexed user,
        uint256 indexed roundIndex,
        uint256 amountUsed
    );

    /**
     * @notice Initializes a new `SavingsCircle` instance.
     * @param _name Human-readable name of the circle.
     * @param _image Optional image or IPFS URI.
     * @param _contributionAmount Fixed per-round contribution (in wei).
     * @param _maxParticipants Maximum number of participants.
     * @param _roundDuration Duration of each round (in seconds).
     * @param _insuranceDeposit Deposit amount required for insurance coverage (in wei).
     * @param _factory Address of the factory contract.
     */
    constructor(
        string memory _name,
        string memory _image,
        uint256 _contributionAmount,
        uint256 _maxParticipants,
        uint256 _roundDuration,
        uint256 _insuranceDeposit,
        address _factory
    ) Ownable(msg.sender) ReentrancyGuard() {
        require(_factory != address(0), "Invalid factory");
        require(bytes(_name).length > 0, "Name required");
        require(_contributionAmount > 0, "Invalid contribution");
        require(_maxParticipants >= 2, "At least two participants");
        require(_roundDuration > 0, "Invalid duration");
        require(
            _insuranceDeposit == _contributionAmount,
            "Insurance must equal contribution"
        );

        name = _name;
        image = _image;
        factory = _factory;
        contributionAmount = _contributionAmount;
        totalParticipants = _maxParticipants;
        roundDuration = _roundDuration;
        insuranceDeposit = _insuranceDeposit;
        currentRound = 0;
    }

    /**
     * @notice Allows users to join the circle by depositing the required insurance collateral.
     *
     * Emits a {ParticipantJoined} event.
     */
    function joinCircle() external payable nonReentrant {
        require(!isParticipant[msg.sender], "Already joined");
        require(!circleCancelled, "Circle cancelled");
        require(participants.length < totalParticipants, "Circle full");
        require(msg.value == insuranceDeposit, "Insurance deposit required");

        participants.push(Participant({wallet: msg.sender}));
        isParticipant[msg.sender] = true;
        insuranceBalance[msg.sender] = msg.value;
        wasCompliant[msg.sender] = true;

        SavingsCircleFactory(factory).registerParticipation(msg.sender);
        emit ParticipantJoined(msg.sender);

        if (participants.length == totalParticipants && rounds.length == 0) {
            address firstBeneficiary = _selectRandomBeneficiary();
            hasReceived[firstBeneficiary] = true;

            Round memory firstRound = Round({
                index: 0,
                totalCollected: 0,
                beneficiary: firstBeneficiary,
                status: RoundStatus.Active,
                startTime: block.timestamp,
                endTime: block.timestamp + roundDuration
            });

            rounds.push(firstRound);
            emit RoundCreated(
                firstRound.index,
                firstBeneficiary,
                firstRound.startTime,
                firstRound.endTime
            );
        }
    }

    /**
     * @notice Retrieves the full list of participants.
     * @return An array of all participant profiles.
     */
    function getParticipants() external view returns (Participant[] memory) {
        return participants;
    }

    /**
     * @notice Allows a participant to contribute their payment to the current round.
     * @dev Automatically triggers coverage or refunds if the deadline has passed.
     *
     * Emits a {ContributionReceived} event and possibly {FundsReleased}.
     */
    function contribute() external payable nonReentrant {
        require(!circleCancelled, "Circle cancelled");
        require(rounds.length > 0, "No active round");

        Round storage round = rounds[currentRound];
        if (
            block.timestamp > round.endTime &&
            round.status == RoundStatus.Active
        ) {
            _handleExpiredRound();
            revert("Round expired - refund triggered");
        }

        require(round.status == RoundStatus.Active, "Round not active");
        require(isParticipant[msg.sender], "Not a participant");
        require(
            !hasContributed[currentRound][msg.sender],
            "Already contributed"
        );
        require(msg.value == contributionAmount, "Incorrect amount");

        round.totalCollected += msg.value;
        hasContributed[currentRound][msg.sender] = true;

        emit ContributionReceived(msg.sender, msg.value);

        if (
            round.totalCollected >=
            contributionAmount * (participants.length - 1)
        ) {
            _releaseFunds(currentRound);
        }
    }

    /**
     * @dev Releases funds to the beneficiary and starts the next round if applicable.
     * @param _roundIndex Index of the completed round.
     *
     * Emits a {FundsReleased} event.
     */
    function _releaseFunds(uint256 _roundIndex) internal {
        Round storage round = rounds[_roundIndex];
        require(round.status == RoundStatus.Active, "Round not active");

        uint256 amount = round.totalCollected;
        round.totalCollected = 0;
        round.status = RoundStatus.Completed;

        payable(round.beneficiary).sendValue(amount);
        emit FundsReleased(_roundIndex, round.beneficiary, amount);

        currentRound++;
        if (currentRound < participants.length) {
            address nextBeneficiary = _selectRandomBeneficiary();
            _autoStartNextRound(nextBeneficiary, round.endTime);
        } else {
            _refundInsurance();
        }
    }

    /**
     * @dev Initializes a new round automatically after the previous one completes.
     * @param _beneficiary The address designated to receive the next round’s funds.
     * @param previousEndTime The timestamp marking the end of the previous round.
     *
     * Emits a {RoundCreated} event.
     */
    function _autoStartNextRound(
        address _beneficiary,
        uint256 previousEndTime
    ) internal {
        Round memory next = Round({
            index: rounds.length,
            totalCollected: 0,
            beneficiary: _beneficiary,
            status: RoundStatus.Active,
            startTime: previousEndTime,
            endTime: previousEndTime + roundDuration
        });

        hasReceived[_beneficiary] = true;
        rounds.push(next);
        emit RoundCreated(
            next.index,
            _beneficiary,
            next.startTime,
            next.endTime
        );
    }

    /**
     * @dev Handles round expiration events and applies insurance coverage if available.
     * If coverage is insufficient, refunds contributors and cancels the tanda.
     *
     * Emits {InsuranceUsed}, {ParticipantDefaulted}, {RefundIssued}, and {CircleCancelled}.
     */
    function _handleExpiredRound() internal {
        Round storage round = rounds[currentRound];
        if (round.status != RoundStatus.Active) return;

        uint256 missingTotal = 0;

        for (uint256 i = 0; i < participants.length; i++) {
            address user = participants[i].wallet;
            if (!hasContributed[currentRound][user]) {
                if (insuranceBalance[user] >= contributionAmount) {
                    insuranceBalance[user] -= contributionAmount;
                    round.totalCollected += contributionAmount;
                    emit InsuranceUsed(currentRound, contributionAmount);
                    emit ParticipantDefaulted(
                        user,
                        currentRound,
                        contributionAmount
                    );
                    wasCompliant[user] = false;
                } else {
                    missingTotal += contributionAmount;
                }
            }
        }

        if (missingTotal == 0) {
            _releaseFunds(currentRound);
        } else {
            round.status = RoundStatus.Failed;
            for (uint256 i = 0; i < participants.length; i++) {
                address payable user = payable(participants[i].wallet);
                if (hasContributed[currentRound][user]) {
                    user.sendValue(contributionAmount);
                }
            }
            emit RefundIssued(currentRound);
            circleCancelled = true;
            emit CircleCancelled(currentRound);
        }
    }

    /**
     * @dev Returns the insurance deposit to all participants once the circle completes successfully.
     *
     * Emits {InsuranceRefunded} for each participant.
     */
    function _refundInsurance() internal {
        for (uint256 i = 0; i < participants.length; i++) {
            address payable user = payable(participants[i].wallet);
            if (insuranceBalance[user] > 0 && wasCompliant[user]) {
                uint256 refundAmount = insuranceBalance[user];
                insuranceBalance[user] = 0;
                user.sendValue(refundAmount);
                emit InsuranceRefunded(user, refundAmount);
            }
        }
    }

    /**
     * @notice Checks whether Chainlink Upkeep should trigger (e.g., a round expired).
     * @dev Returns true only if the active round has passed its end time.
     */
    function checkUpkeep(
        bytes calldata
    ) external view returns (bool upkeepNeeded, bytes memory) {
        if (rounds.length == 0 || circleCancelled) return (false, "");
        Round storage round = rounds[currentRound];
        bool isExpired = (round.status == RoundStatus.Active &&
            block.timestamp > round.endTime);
        return (isExpired, "");
    }

    /**
     * @notice Automatically executed when upkeep is needed.
     * @dev Triggers expired round handling without requiring admin action.
     */
    function performUpkeep(bytes calldata) external {
        Round storage round = rounds[currentRound];
        if (
            round.status == RoundStatus.Active &&
            block.timestamp > round.endTime
        ) {
            _handleExpiredRound();
        }
    }

    /**
     * @dev Randomly selects the next beneficiary from participants who haven’t received funds yet.
     * @return The wallet address of the selected beneficiary.
     */
    function _selectRandomBeneficiary() internal view returns (address) {
        uint256 rand = uint256(
            keccak256(
                abi.encodePacked(
                    block.timestamp,
                    block.prevrandao,
                    rounds.length
                )
            )
        ) % participants.length;

        for (uint256 i = 0; i < participants.length; i++) {
            address candidate = participants[(rand + i) % participants.length]
                .wallet;
            if (!hasReceived[candidate]) return candidate;
        }
        revert("No eligible beneficiary left");
    }

    /**
     * @notice Returns all rounds in a simplified schedule format for frontend display.
     * @return schedule An array of all round details.
     */
    function getSchedule()
        external
        view
        returns (RoundSchedule[] memory schedule)
    {
        schedule = new RoundSchedule[](rounds.length);
        for (uint256 i = 0; i < rounds.length; i++) {
            schedule[i] = RoundSchedule({
                index: rounds[i].index,
                beneficiary: rounds[i].beneficiary,
                startTime: rounds[i].startTime,
                endTime: rounds[i].endTime,
                status: rounds[i].status
            });
        }
    }
}
