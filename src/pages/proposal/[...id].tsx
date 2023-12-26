import React, { useEffect, useState } from "react";
import {
  PicLeftOutlined,
  CheckOutlined,
  CloseOutlined,
  BorderOuterOutlined,
} from "@ant-design/icons";
import { Button, Form, Radio } from "antd";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

import ProposalInfo from "@/components/ProposalInfo";
import { useChain } from "@cosmos-kit/react";
import { network } from "@/config";
import {
  DaoProposalSingleClient,
  DaoProposalSingleQueryClient,
} from "@/codegen/DaoProposalSingle.client";
import { SingleChoiceProposal } from "@/codegen/types";

const Proposal = () => {
  const { getCosmWasmClient, getSigningCosmWasmClient, status, address } =
    useChain(network.chainName);
  const router = useRouter();

  const [proposalQueryClient, setProposalQueryClient] =
    useState<DaoProposalSingleQueryClient | null>(null);
  const [proposalPathInfo, setProposalPathInfo] = useState<{
    proposal_addr: string;
    proposal_id: string;
  } | null>(null);
  const [proposalInfo, setProposalInfo] = useState<SingleChoiceProposal | null>(
    null
  );
  const [loadingVote, setLoadingVote] = useState(false);

  const onFinish = async (values: any) => {
    console.log("Success:", values);

    if (address && proposalPathInfo) {
      setLoadingVote(true);
      try {
        const client = await getSigningCosmWasmClient();
        const proposalClient = new DaoProposalSingleClient(
          client,
          address,
          proposalPathInfo.proposal_addr
        );
        await proposalClient.vote({
          proposalId: Number(proposalPathInfo.proposal_id),
          vote: values.voting,
        });

        setLoadingVote(false);
        toast.success("Vote success !", {
          position: toast.POSITION.TOP_RIGHT,
        });
        if (proposalQueryClient) {
          const proposal = await proposalQueryClient.proposal({
            proposalId: Number(proposalPathInfo.proposal_id),
          });
          setProposalInfo(proposal.proposal)
        }
      } catch (err: any) {
        console.log(err);

        setLoadingVote(false);
        toast.error(err, {
          position: toast.POSITION.TOP_RIGHT,
        });
      }
    }
  };

  const onFinishFailed = (errorInfo: any) => {
    console.log("Failed:", errorInfo);
  };

  type FieldType = {
    voting?: string;
  };

  useEffect(() => {
    const getProposalInfo = async () => {
      if (router.isReady && router.query.id) {
        const routerPath = router.query.id;

        const client = await getCosmWasmClient();
        const newProposalClient = new DaoProposalSingleQueryClient(
          client,
          routerPath[0]
        );
        const proposal = await newProposalClient.proposal({
          proposalId: Number(routerPath[1]),
        });

        setProposalQueryClient(newProposalClient);
        setProposalPathInfo({
          proposal_addr: routerPath[0],
          proposal_id: routerPath[1],
        });
        setProposalInfo(proposal.proposal);
      }
    };

    getProposalInfo();
  }, [router]);

  console.log(proposalInfo);

  return (
    <div id="proposal">
      <div className="col-span-3 flex flex-col gap-8">
        <div className="flex flex-col gap-3 text-[18px] text-third-grey ">
          <div className="flex items-center gap-3">
            <PicLeftOutlined className="text-[22px]" />
            <h1>Status</h1>
          </div>
          <p className="pr-6">
            If the current vote stands, this proposal will fail due to a lack of
            voter participation.
          </p>
        </div>

        <ProposalInfo proposal={proposalInfo} />

        {status === "Connected" && (
          <div className="pt-8 border-t border-secondary-grey-bg">
            <Form
              name="basic"
              labelCol={{ span: 24 }}
              wrapperCol={{ span: 24 }}
              style={{ maxWidth: 600 }}
              initialValues={{ remember: true }}
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              autoComplete="off"
            >
              <Form.Item<FieldType> label="Voting" name="voting">
                <Radio.Group>
                  <Radio value="yes">
                    <span>Yes</span>
                    <CheckOutlined className="text-[20px]" />
                  </Radio>
                  <Radio value="no">
                    <span>No</span>
                    <CloseOutlined className="text-[20px]" />
                  </Radio>
                  <Radio value="abstain">
                    <span>Abstain</span>
                    <BorderOuterOutlined className="text-[20px]" />
                  </Radio>
                </Radio.Group>
              </Form.Item>

              <Form.Item>
                <Button type="primary" htmlType="submit" loading={loadingVote}>
                  Cast your vote
                </Button>
              </Form.Item>
            </Form>
          </div>
        )}
      </div>

      <div className="col-span-5 flex flex-col">
        <h1 className="text-secondary-grey text-[32px] mb-12 font-bold">
          Nois - Store the Randdrop Contract
        </h1>
        <div className="flex flex-col gap-6">
          <p className="text-[16px] text-third-grey font-medium">
            November 30
          </p>
          <p className="text-[16px] text-secondary-grey pr-6 tracking-wider leading-6">
            This proposal aims to store the Wasm code for the nois-randdrop
            contract. Once instantiated it will allow eligible stakers to
            participate in the randdrop. Ps: If this proposal passes we would
            raise another proposal to store the Nois proxy contract that acts as
            an outpost contract on osmosis to allow requesting the unpredictable
            randomness (Needed to conduct the randdrop). The snapshot that we
            would use for the randdrop has been taken at height 12542000 and you
            can check the full list of eligibility here
            https://github.com/noislabs/randdrop-snapshots/tree/v0.1.0 For more
            info check the forum post here
            https://forum.osmosis.zone/t/proposal-for-deployment-of-nois-randdrop-contract-on-osmosis/646.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Proposal;
