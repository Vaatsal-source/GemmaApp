import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, BottomTabInset, MaxContentWidth } from '@/constants/theme';
import CustomButton from '@/components/CustomButton';

interface MeshNode {
  id: string;
  name: string;
  type: 'relay' | 'victim' | 'responder';
  battery: number;
  assignedRole?: string;
}

export default function MeshSimulator() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [meshActive, setMeshActive] = useState(true);
  const [messages, setMessages] = useState<Array<{ sender: string; text: string; time: string }>>([
    { sender: 'Pooja (Node B)', text: 'Water is rising here near the school entrance. Exit blocked.', time: '12:01' },
    { sender: 'Rescue Team', text: 'Helicopter dispatched. Reach cyclone shelter.', time: '11:58' }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const [nodes, setNodes] = useState<MeshNode[]>([
    { id: 'A', name: 'Sunil (Node A)', type: 'relay', battery: 84 },
    { id: 'B', name: 'Pooja (Node B)', type: 'victim', battery: 67 },
    { id: 'C', name: 'Rajesh (Node C)', type: 'relay', battery: 92 },
    { id: 'R', name: 'NDRF Base Station', type: 'responder', battery: 100 }
  ]);

  const [commanderMode, setCommanderMode] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const assignRole = (nodeId: string, role: string) => {
    setNodes(nodes.map(n => n.id === nodeId ? { ...n, assignedRole: role } : n));
    setSelectedNode(null);
    alert(`Assigned ${nodes.find(n => n.id === nodeId)?.name} as: ${role}. Sent via mesh packet.`);
  };

  const simulateBroadcast = () => {
    alert('SITREP packet compiled and broadcasted via Bluetooth Mesh. Hopping via Node A & C to reach NDRF Base Station.');
    const newMsg = {
      sender: 'You (Me)',
      text: 'RAKSHAK SOS - Assistance requested. GPS active.',
      time: new Date().toISOString().substring(11, 16)
    };
    setMessages([newMsg, ...messages]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>📡 Offline Mesh Network</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Infrastructure-free communication hub
            </Text>
          </View>

          {/* Connection status banner */}
          <View style={[
            styles.statusBanner, 
            { backgroundColor: meshActive ? '#388E3C' : '#D32F2F' }
          ]}>
            <Text style={styles.statusText}>
              {meshActive ? 'CONNECTED TO PEER MESH (4 NODES ACTIVE)' : 'MESH CONNECTION INACTIVE'}
            </Text>
            <Pressable onPress={() => setMeshActive(!meshActive)}>
              <Text style={styles.toggleText}>{meshActive ? 'Disable' : 'Enable'}</Text>
            </Pressable>
          </View>

          {meshActive && (
            <View style={styles.meshContent}>
              
              {/* Message routing visualization */}
              <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>🔗 Dynamic Mesh Relay Path</Text>
                <Text style={[styles.captionText, { color: colors.textSecondary }]}>
                  Shows the multi-hop path to reach emergency responders when cellular towers are down.
                </Text>

                <View style={styles.routingVisual}>
                  <View style={[styles.routingNode, { backgroundColor: '#1976D2' }]}>
                    <Text style={styles.nodeLabel}>You</Text>
                  </View>
                  <Text style={[styles.routingArrow, { color: colors.text }]}>⟶</Text>
                  
                  <View style={[styles.routingNode, { backgroundColor: colors.backgroundSelected }]}>
                    <Text style={[styles.nodeLabel, { color: colors.text }]}>Node A</Text>
                  </View>
                  <Text style={[styles.routingArrow, { color: colors.text }]}>⟶</Text>
                  
                  <View style={[styles.routingNode, { backgroundColor: colors.backgroundSelected }]}>
                    <Text style={[styles.nodeLabel, { color: colors.text }]}>Node C</Text>
                  </View>
                  <Text style={[styles.routingArrow, { color: colors.text }]}>⟶</Text>
                  
                  <View style={[styles.routingNode, { backgroundColor: '#388E3C' }]}>
                    <Text style={styles.nodeLabel}>Rescue</Text>
                  </View>
                </View>
                
                <Text style={[styles.routingDesc, { color: colors.textSecondary }]}>
                  Path active. Estimated delivery delay: ~1.2 seconds.
                </Text>

                <CustomButton
                  title="Broadcast SOS & SITREP"
                  variant="danger"
                  onPress={simulateBroadcast}
                  style={{ marginTop: Spacing.two }}
                />
              </View>

              {/* Incident commander coordination mode */}
              <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>👮 Incident Commander Mode</Text>
                  <Pressable 
                    onPress={() => setCommanderMode(!commanderMode)}
                    style={[styles.modeToggleBtn, { backgroundColor: commanderMode ? '#1976D2' : colors.backgroundSelected }]}
                  >
                    <Text style={{ fontSize: 11, color: commanderMode ? '#FFFFFF' : colors.text, fontWeight: 'bold' }}>
                      {commanderMode ? 'ON' : 'OFF'}
                    </Text>
                  </Pressable>
                </View>
                <Text style={[styles.captionText, { color: colors.textSecondary }]}>
                  Automatically coordinates volunteers by assigning roles over the local mesh.
                </Text>

                {commanderMode ? (
                  <View style={styles.commanderContainer}>
                    <Text style={[styles.subHeading, { color: colors.text }]}>Assign Volunteer Roles</Text>
                    {nodes.filter(n => n.type !== 'responder').map((node) => (
                      <View key={node.id} style={[styles.volunteerRow, { borderBottomColor: colors.backgroundSelected }]}>
                        <View>
                          <Text style={[styles.volunteerName, { color: colors.text }]}>{node.name}</Text>
                          <Text style={[styles.volunteerRole, { color: '#1976D2' }]}>
                            Role: {node.assignedRole || 'Unassigned'}
                          </Text>
                        </View>
                        <CustomButton
                          title="Assign"
                          variant="outline"
                          onPress={() => setSelectedNode(node.id)}
                          style={styles.assignBtn}
                          textStyle={{ fontSize: 12 }}
                        />
                      </View>
                    ))}

                    {selectedNode && (
                      <View style={[styles.roleSelectBox, { backgroundColor: colors.background }]}>
                        <Text style={[styles.roleSelectTitle, { color: colors.text }]}>
                          Assign role to {nodes.find(n => n.id === selectedNode)?.name}:
                        </Text>
                        <View style={styles.roleBtnGrid}>
                          {['First Aid Lead', 'Evacuation Guide', 'Supply Marshal', 'Search & Rescue'].map((role) => (
                            <Pressable
                              key={role}
                              onPress={() => assignRole(selectedNode, role)}
                              style={[styles.roleBtn, { backgroundColor: colors.backgroundElement }]}
                            >
                              <Text style={[styles.roleBtnText, { color: colors.text }]}>{role}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text style={[styles.promptText, { color: colors.textSecondary }]}>
                    Turn on Incident Commander Mode to designate coordinates and delegate emergency responsibilities to nearby volunteers.
                  </Text>
                )}
              </View>

              {/* Chat messages */}
              <View style={[styles.section, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>💬 Mesh Messages (Offline Feed)</Text>
                
                <View style={styles.messageScroll}>
                  {messages.map((msg, i) => (
                    <View key={i} style={[styles.msgBox, { backgroundColor: colors.background }]}>
                      <View style={styles.msgHeader}>
                        <Text style={[styles.msgSender, { color: colors.text }]}>{msg.sender}</Text>
                        <Text style={[styles.msgTime, { color: colors.textSecondary }]}>{msg.time}</Text>
                      </View>
                      <Text style={[styles.msgText, { color: colors.text }]}>{msg.text}</Text>
                    </View>
                  ))}
                </View>
              </View>

            </View>
          )}

          {!meshActive && (
            <View style={styles.inactivePrompt}>
              <Text style={[styles.promptText, { color: colors.textSecondary }]}>
                Activate Bluetooth Mesh Connection to scan and link with nearby emergency nodes.
              </Text>
            </View>
          )}

        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    marginBottom: Spacing.four,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBanner: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  statusText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 11,
  },
  toggleText: {
    color: '#FFFFFF',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
    fontSize: 11,
  },
  meshContent: {
    gap: Spacing.three,
  },
  section: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  captionText: {
    fontSize: 11,
    marginBottom: Spacing.two,
  },
  routingVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.three,
  },
  routingNode: {
    width: 60,
    height: 36,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  nodeLabel: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  routingArrow: {
    fontSize: 16,
    marginHorizontal: Spacing.one,
  },
  routingDesc: {
    fontSize: 11,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: Spacing.one,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeToggleBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 4,
    borderRadius: Spacing.one,
  },
  promptText: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: Spacing.one,
  },
  commanderContainer: {
    marginTop: Spacing.two,
    gap: Spacing.two,
  },
  subHeading: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  volunteerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  volunteerName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  volunteerRole: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  assignBtn: {
    minHeight: 32,
    paddingVertical: Spacing.half,
  },
  roleSelectBox: {
    padding: Spacing.three,
    borderRadius: Spacing.one,
    marginTop: Spacing.two,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  roleSelectTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
  },
  roleBtnGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.one,
  },
  roleBtn: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageScroll: {
    maxHeight: 180,
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  msgBox: {
    padding: Spacing.two,
    borderRadius: Spacing.one,
    elevation: 1,
  },
  msgHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.half,
  },
  msgSender: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  msgTime: {
    fontSize: 10,
  },
  msgText: {
    fontSize: 13,
  },
  inactivePrompt: {
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
});
