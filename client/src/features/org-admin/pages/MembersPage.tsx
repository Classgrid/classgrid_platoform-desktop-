import { useState } from "react";
import {
  Card,
  Title,
  Text,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
  TextInput,
  Select,
  SelectItem,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Flex,
} from "@tremor/react";
import { Search, UserPlus, Mail, Trash2, Send } from "lucide-react";
import {
  useMembers,
  usePendingMembers,
  useInviteStaff,
  useRemoveMember,
  useResendInvite,
  useOrgRoles,
} from "../queries/useOrgAdminMembers";
import { format } from "date-fns";

export function MembersPage() {
  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("faculty");
  const [inviteDept, setInviteDept] = useState("");

  const { data: membersData, isLoading: loadingMembers } = useMembers({
    search: search !== "" ? search : undefined,
    role: selectedRole !== "all" ? selectedRole : undefined,
  });

  const { data: pendingData, isLoading: loadingPending } = usePendingMembers();

  const { data: rolesData, isLoading: loadingRoles } = useOrgRoles();
  const roles = rolesData?.roles || [];

  const inviteMutation = useInviteStaff();
  const removeMutation = useRemoveMember();
  const resendMutation = useResendInvite();

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteName || !inviteRole) return;
    inviteMutation.mutate(
      { email: inviteEmail, name: inviteName, role: inviteRole, department: inviteDept },
      {
        onSuccess: () => {
          setInviteEmail("");
          setInviteName("");
          setInviteDept("");
        },
      }
    );
  };

  const getRoleLabel = (roleValue: string) => {
    return roles.find((r) => r.value === roleValue)?.label || roleValue;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto space-y-8">
      <div>
        <Title className="text-2xl font-semibold text-gray-900 dark:text-gray-50">Members</Title>
        <Text>Manage team members and invitations</Text>
      </div>

      <TabGroup>
        <TabList className="mb-6">
          <Tab>Team Members</Tab>
          <Tab>Pending Invitations</Tab>
        </TabList>

        <TabPanels>
          {/* TEAM MEMBERS TAB */}
          <TabPanel>
            {/* INVITE SECTION */}
            <Card className="mb-8">
              <Title className="mb-2">Invite Members</Title>
              <Text className="mb-6">
                Add new members to your team by entering their details and assigning a role.
              </Text>
              
              <form onSubmit={handleInvite}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <TextInput
                    placeholder="Full Name"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    required
                  />
                  <TextInput
                    placeholder="Email Address"
                    type="email"
                    icon={Mail}
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                  <Select
                    value={inviteRole}
                    onValueChange={setInviteRole}
                    enableClear={false}
                    disabled={loadingRoles}
                  >
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </Select>
                  <TextInput
                    placeholder="Department (Optional)"
                    value={inviteDept}
                    onChange={(e) => setInviteDept(e.target.value)}
                  />
                </div>
                <Flex justifyContent="end">
                  <Button
                    type="submit"
                    icon={UserPlus}
                    loading={inviteMutation.isPending}
                  >
                    Send Invitation
                  </Button>
                </Flex>
              </form>
            </Card>

            {/* MEMBERS LIST */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="w-full sm:max-w-xs">
                <TextInput
                  icon={Search}
                  placeholder="Filter by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="w-full sm:max-w-xs">
                <Select
                  value={selectedRole}
                  onValueChange={setSelectedRole}
                  enableClear={false}
                  disabled={loadingRoles}
                >
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            <Card>
              {loadingMembers ? (
                <div className="py-10 text-center text-gray-500">Loading members...</div>
              ) : membersData?.members && membersData.members.length > 0 ? (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>User</TableHeaderCell>
                      <TableHeaderCell>Role</TableHeaderCell>
                      <TableHeaderCell>Department</TableHeaderCell>
                      <TableHeaderCell>Joined</TableHeaderCell>
                      <TableHeaderCell className="text-right">Action</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {membersData.members.map((member) => (
                      <TableRow key={member._id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                              {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                              <p className="text-xs text-gray-500">{member.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge color="blue">{getRoleLabel(member.role)}</Badge>
                        </TableCell>
                        <TableCell>
                          {member.department || <span className="text-gray-400">-</span>}
                        </TableCell>
                        <TableCell>
                          <Text>{format(new Date(member.createdAt), "MMM d, yyyy")}</Text>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="xs"
                            variant="light"
                            color="red"
                            icon={Trash2}
                            onClick={() => {
                              if (confirm(`Remove ${member.name} from the organization?`)) {
                                removeMutation.mutate(member._id);
                              }
                            }}
                            loading={removeMutation.isPending && removeMutation.variables === member._id}
                          >
                            Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-10 text-center text-gray-500">
                  No members found.
                </div>
              )}
            </Card>
          </TabPanel>

          {/* PENDING INVITATIONS TAB */}
          <TabPanel>
            <Card>
              {loadingPending ? (
                <div className="py-10 text-center text-gray-500">Loading invitations...</div>
              ) : pendingData?.pending && pendingData.pending.length > 0 ? (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Invited User</TableHeaderCell>
                      <TableHeaderCell>Role</TableHeaderCell>
                      <TableHeaderCell>Department</TableHeaderCell>
                      <TableHeaderCell>Invited On</TableHeaderCell>
                      <TableHeaderCell className="text-right">Action</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingData.pending.map((member) => (
                      <TableRow key={member._id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{member.name}</p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge color="blue">{getRoleLabel(member.role)}</Badge>
                        </TableCell>
                        <TableCell>
                          {member.department || <span className="text-gray-400">-</span>}
                        </TableCell>
                        <TableCell>
                          <Text>{format(new Date(member.createdAt), "MMM d, yyyy")}</Text>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="xs"
                              variant="secondary"
                              icon={Send}
                              onClick={() => resendMutation.mutate(member._id)}
                              loading={resendMutation.isPending && resendMutation.variables === member._id}
                            >
                              Resend
                            </Button>
                            <Button
                              size="xs"
                              variant="light"
                              color="red"
                              icon={Trash2}
                              onClick={() => {
                                if (confirm(`Cancel invitation for ${member.name}?`)) {
                                  removeMutation.mutate(member._id);
                                }
                              }}
                              loading={removeMutation.isPending && removeMutation.variables === member._id}
                            >
                              Cancel
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="py-10 text-center text-gray-500">
                  No pending invitations.
                </div>
              )}
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
